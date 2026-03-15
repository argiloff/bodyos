import { getDatabase } from '../db/schema';
import type { Recipe, RecipeIngredient, RecipeStep, RecipeWithDetails, MealType } from '../types';
import { uid } from '../types';

// ─── Read ─────────────────────────────────────────────────────

export async function getAllRecipes(): Promise<Recipe[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<Recipe & { tags: string }>(
    'SELECT * FROM recipes ORDER BY name COLLATE NOCASE'
  );
  return rows.map(r => ({ ...r, tags: JSON.parse(r.tags as string) }));
}

export async function getRecipeById(id: string): Promise<Recipe | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<Recipe & { tags: string }>(
    'SELECT * FROM recipes WHERE id = ?', id
  );
  if (!row) return null;
  return { ...row, tags: JSON.parse(row.tags as string) };
}

export async function getRecipeWithDetails(id: string): Promise<RecipeWithDetails | null> {
  const recipe = await getRecipeById(id);
  if (!recipe) return null;

  const db = await getDatabase();
  const ingredients = await db.getAllAsync<RecipeIngredient>(
    'SELECT * FROM recipe_ingredients WHERE recipe_id = ? ORDER BY sort_order',
    id
  );
  const steps = await db.getAllAsync<RecipeStep>(
    'SELECT * FROM recipe_steps WHERE recipe_id = ? ORDER BY step_number',
    id
  );

  return { ...recipe, ingredients, steps };
}

export async function getAllRecipesWithDetails(): Promise<RecipeWithDetails[]> {
  const recipes = await getAllRecipes();
  const db = await getDatabase();

  const allIngredients = await db.getAllAsync<RecipeIngredient>(
    'SELECT * FROM recipe_ingredients ORDER BY sort_order'
  );
  const allSteps = await db.getAllAsync<RecipeStep>(
    'SELECT * FROM recipe_steps ORDER BY step_number'
  );

  const ingredientsByRecipe: Record<string, RecipeIngredient[]> = {};
  for (const ing of allIngredients) {
    if (!ingredientsByRecipe[ing.recipe_id]) ingredientsByRecipe[ing.recipe_id] = [];
    ingredientsByRecipe[ing.recipe_id].push(ing);
  }

  const stepsByRecipe: Record<string, RecipeStep[]> = {};
  for (const step of allSteps) {
    if (!stepsByRecipe[step.recipe_id]) stepsByRecipe[step.recipe_id] = [];
    stepsByRecipe[step.recipe_id].push(step);
  }

  return recipes.map(r => ({
    ...r,
    ingredients: ingredientsByRecipe[r.id] ?? [],
    steps: stepsByRecipe[r.id] ?? [],
  }));
}

export async function getRecipesByMealType(mealType: MealType): Promise<RecipeWithDetails[]> {
  const all = await getAllRecipesWithDetails();
  return all.filter(r => r.meal_type === mealType);
}

export async function getRecipeCount(): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM recipes');
  return row?.count ?? 0;
}

// ─── Write ────────────────────────────────────────────────────

export async function upsertRecipe(
  recipe: { id?: string; name: string; description: string; meal_type: MealType; tags: string[] },
  ingredients: { product_id: string; amount_g: number }[],
  steps: { instruction: string; image_uri?: string }[]
): Promise<RecipeWithDetails> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const recipeId = recipe.id?.trim() || uid('recipe');

  await db.execAsync('BEGIN TRANSACTION');
  try {
    // Upsert recipe
    const existing = await db.getFirstAsync<{ id: string }>(
      'SELECT id FROM recipes WHERE id = ?', recipeId
    );

    if (existing) {
      await db.runAsync(
        `UPDATE recipes SET name = ?, description = ?, meal_type = ?, tags = ?, updated_at = ? WHERE id = ?`,
        recipe.name, recipe.description, recipe.meal_type,
        JSON.stringify(recipe.tags), now, recipeId
      );
    } else {
      await db.runAsync(
        `INSERT INTO recipes (id, name, description, meal_type, tags, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        recipeId, recipe.name, recipe.description, recipe.meal_type,
        JSON.stringify(recipe.tags), now, now
      );
    }

    // Replace ingredients
    await db.runAsync('DELETE FROM recipe_ingredients WHERE recipe_id = ?', recipeId);
    for (let i = 0; i < ingredients.length; i++) {
      const ing = ingredients[i];
      await db.runAsync(
        'INSERT INTO recipe_ingredients (id, recipe_id, product_id, amount_g, sort_order) VALUES (?, ?, ?, ?, ?)',
        uid('ri'), recipeId, ing.product_id, ing.amount_g, i
      );
    }

    // Replace steps
    await db.runAsync('DELETE FROM recipe_steps WHERE recipe_id = ?', recipeId);
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      await db.runAsync(
        'INSERT INTO recipe_steps (id, recipe_id, step_number, instruction, image_uri) VALUES (?, ?, ?, ?, ?)',
        uid('rs'), recipeId, i + 1, step.instruction, step.image_uri ?? null
      );
    }

    await db.execAsync('COMMIT');
  } catch (e) {
    await db.execAsync('ROLLBACK');
    throw e;
  }

  return (await getRecipeWithDetails(recipeId))!;
}

export async function deleteRecipe(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM recipes WHERE id = ?', id);
}

// ─── Bulk ─────────────────────────────────────────────────────

export async function bulkUpsertRecipes(
  recipes: {
    id?: string;
    name: string;
    description: string;
    meal_type: MealType;
    tags: string[];
    ingredients: { product_id: string; amount_g: number }[];
    steps: { instruction: string; image_uri?: string }[];
  }[]
): Promise<number> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  let count = 0;

  await db.execAsync('BEGIN TRANSACTION');
  try {
    for (const recipe of recipes) {
      const recipeId = recipe.id?.trim() || uid('recipe');

      await db.runAsync(
        `INSERT OR REPLACE INTO recipes (id, name, description, meal_type, tags, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, COALESCE((SELECT created_at FROM recipes WHERE id = ?), ?), ?)`,
        recipeId, recipe.name, recipe.description, recipe.meal_type,
        JSON.stringify(recipe.tags), recipeId, now, now
      );

      // Ingredients
      await db.runAsync('DELETE FROM recipe_ingredients WHERE recipe_id = ?', recipeId);
      for (let i = 0; i < recipe.ingredients.length; i++) {
        const ing = recipe.ingredients[i];
        if (!ing.product_id) continue;
        await db.runAsync(
          'INSERT INTO recipe_ingredients (id, recipe_id, product_id, amount_g, sort_order) VALUES (?, ?, ?, ?, ?)',
          uid('ri'), recipeId, ing.product_id, ing.amount_g, i
        );
      }

      // Steps
      await db.runAsync('DELETE FROM recipe_steps WHERE recipe_id = ?', recipeId);
      for (let i = 0; i < recipe.steps.length; i++) {
        const step = recipe.steps[i];
        await db.runAsync(
          'INSERT INTO recipe_steps (id, recipe_id, step_number, instruction, image_uri) VALUES (?, ?, ?, ?, ?)',
          uid('rs'), recipeId, i + 1, step.instruction, step.image_uri ?? null
        );
      }

      count++;
    }

    await db.execAsync('COMMIT');
  } catch (e) {
    await db.execAsync('ROLLBACK');
    throw e;
  }

  return count;
}
