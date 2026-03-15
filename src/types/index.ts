// ─── Meal Types ───────────────────────────────────────────────
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: 'Frühstück',
  lunch: 'Mittagessen',
  dinner: 'Abendessen',
  snack: 'Snack',
};

// ─── Product ──────────────────────────────────────────────────
export type Product = {
  id: string;
  name: string;
  category: string;
  image_uri?: string;
  kcal_per_100g: number;
  protein_per_100g: number;
  fat_per_100g: number;
  carbs_per_100g: number;
  fiber_per_100g: number;
  created_at: string;
  updated_at: string;
};

export type ProductSubstitute = {
  product_id: string;
  substitute_id: string;
};

export type ProductInsert = Omit<Product, 'created_at' | 'updated_at'>;

// ─── Recipe ───────────────────────────────────────────────────
export type Recipe = {
  id: string;
  name: string;
  description: string;
  meal_type: MealType;
  tags: string[];
  created_at: string;
  updated_at: string;
};

export type RecipeIngredient = {
  id: string;
  recipe_id: string;
  product_id: string;
  amount_g: number;
  sort_order: number;
};

export type RecipeStep = {
  id: string;
  recipe_id: string;
  step_number: number;
  instruction: string;
  image_uri?: string;
};

export type RecipeWithDetails = Recipe & {
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
};

export type RecipeInsert = Omit<Recipe, 'created_at' | 'updated_at'>;

// ─── Plan ─────────────────────────────────────────────────────
export type Plan = {
  id: string;
  start_date: string;
  end_date: string;
  calorie_target: number;
  protein_target: number;
  created_at: string;
};

export type PlanMeal = {
  id: string;
  plan_id: string;
  date: string;
  meal_type: MealType;
  recipe_id: string;
};

export type PlanWithMeals = Plan & {
  meals: PlanMeal[];
};

export type PlanInsert = Omit<Plan, 'created_at'>;

// ─── Profile / Settings ───────────────────────────────────────
export type Profile = {
  calorie_target: number;
  protein_target: number;
  excluded_product_ids: string[];
};

// ─── Grocery ──────────────────────────────────────────────────
export type GroceryItem = {
  product_id: string;
  name: string;
  category: string;
  amount_g: number;
};

// ─── Macros ───────────────────────────────────────────────────
export type Macros = {
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
};

// ─── Import / Export ──────────────────────────────────────────
export type ImportPayload = {
  products?: ImportProduct[];
  recipes?: ImportRecipe[];
};

export type ImportProduct = {
  id: string;
  name: string;
  category: string;
  imageUri?: string;
  image_uri?: string;
  kcal_per_100g: number;
  protein_per_100g: number;
  fat_per_100g: number;
  carbs_per_100g: number;
  fiber_per_100g: number;
  allowed_substitutes?: string[];
};

export type ImportRecipeIngredient = {
  productId?: string;
  product_id?: string;
  amount_g: number;
};

export type ImportRecipe = {
  id?: string;
  name: string;
  description?: string;
  mealType?: MealType;
  meal_type?: MealType;
  tags?: string[];
  instructions?: string[];
  stepImageUris?: string[];
  step_image_uris?: string[];
  ingredients: ImportRecipeIngredient[];
};

// ─── Utility ──────────────────────────────────────────────────
export function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

export function computeMacros(
  ingredients: { product_id: string; amount_g: number }[],
  productsById: Record<string, Product>,
): Macros {
  return ingredients.reduce<Macros>(
    (acc, ing) => {
      const p = productsById[ing.product_id];
      if (!p) return acc;
      const f = ing.amount_g / 100;
      return {
        kcal: acc.kcal + p.kcal_per_100g * f,
        protein: acc.protein + p.protein_per_100g * f,
        fat: acc.fat + p.fat_per_100g * f,
        carbs: acc.carbs + p.carbs_per_100g * f,
        fiber: acc.fiber + p.fiber_per_100g * f,
      };
    },
    { kcal: 0, protein: 0, fat: 0, carbs: 0, fiber: 0 },
  );
}
