import { Prisma } from "@prisma/client";
import { prisma } from "../db";
import { plannerInputSchema } from "../validation/schemas";

export type PlannerInput = {
  userId: string;
  startDate: string;
  endDate: string;
  calorieTarget: number;
  proteinTarget: number;
};

type ProductMap = Record<
  string,
  {
    kcal_per_100g: number;
    protein_per_100g: number;
    fat_per_100g: number;
    carbs_per_100g: number;
    fiber_per_100g: number;
    allowed_substitutes: string[];
  }
>;

export type RecipeIngredientWithProduct = {
  productId: string;
  amount_g: number;
  product: {
    id: string;
    kcal_per_100g: number;
    protein_per_100g: number;
    fat_per_100g: number;
    carbs_per_100g: number;
    fiber_per_100g: number;
    allowed_substitutes: string[];
  };
};

export type RecipeWithIngredients = {
  id: string;
  name: string;
  mealType: string;
  instructions: unknown;
  tags: unknown;
  description: string;
  ingredients: RecipeIngredientWithProduct[];
};

export type Macro = {
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
};

const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"] as const;
type MealType = (typeof MEAL_TYPES)[number];
type DbRecipeWithIngredients = Prisma.RecipeGetPayload<{
  include: { ingredients: { include: { product: true } } };
}>;

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.length > 0);
}

function isMealType(value: string): value is MealType {
  return (MEAL_TYPES as readonly string[]).includes(value);
}

function computeIngredientMacros(ingredient: RecipeIngredientWithProduct) {
  const factor = ingredient.amount_g / 100;
  return {
    kcal: ingredient.product.kcal_per_100g * factor,
    protein: ingredient.product.protein_per_100g * factor,
    fat: ingredient.product.fat_per_100g * factor,
    carbs: ingredient.product.carbs_per_100g * factor,
    fiber: ingredient.product.fiber_per_100g * factor,
  } satisfies Macro;
}

export function computeRecipeMacros(recipe: RecipeWithIngredients) {
  return recipe.ingredients.reduce(
    (acc, ing) => {
      const m = computeIngredientMacros(ing);
      return {
        kcal: acc.kcal + m.kcal,
        protein: acc.protein + m.protein,
        fat: acc.fat + m.fat,
        carbs: acc.carbs + m.carbs,
        fiber: acc.fiber + m.fiber,
      } satisfies Macro;
    },
    { kcal: 0, protein: 0, fat: 0, carbs: 0, fiber: 0 }
  );
}

export function substituteIngredients(
  recipe: RecipeWithIngredients,
  excluded: Set<string>,
  products: ProductMap
): RecipeWithIngredients | null {
  const newIngredients: RecipeIngredientWithProduct[] = [];
  for (const ing of recipe.ingredients) {
    if (!excluded.has(ing.productId)) {
      newIngredients.push(ing);
      continue;
    }
    const product = products[ing.productId];
    if (!product) return null;
    const substituteId = product.allowed_substitutes.find((id) => !excluded.has(id) && products[id]);
    if (!substituteId) return null;
    const subProduct = products[substituteId];
    newIngredients.push({
      ...ing,
      productId: substituteId,
      product: {
        id: substituteId,
        kcal_per_100g: subProduct.kcal_per_100g,
        protein_per_100g: subProduct.protein_per_100g,
        fat_per_100g: subProduct.fat_per_100g,
        carbs_per_100g: subProduct.carbs_per_100g,
        fiber_per_100g: subProduct.fiber_per_100g,
        allowed_substitutes: subProduct.allowed_substitutes,
      },
    });
  }
  return { ...recipe, ingredients: newIngredients };
}

export function isWithinTargets(total: Macro, calorieTarget: number, proteinTarget: number) {
  const kcalLow = calorieTarget * 0.95;
  const kcalHigh = calorieTarget * 1.05;
  return total.kcal >= kcalLow && total.kcal <= kcalHigh && total.protein >= proteinTarget;
}

export async function generatePlan(input: PlannerInput) {
  const parsed = plannerInputSchema.parse(input);
  const start = new Date(parsed.startDate);
  const end = new Date(parsed.endDate);
  if (start > end) throw new Error("Start date must be before end date");

  const profile = await prisma.profile.findUnique({ where: { userId: parsed.userId } });
  const excluded = new Set<string>(toStringArray(profile?.excludedProducts));

  const products = await prisma.product.findMany();
  const productMap = products.reduce((acc: ProductMap, p: (typeof products)[number]) => {
    acc[p.id] = {
      kcal_per_100g: p.kcal_per_100g,
      protein_per_100g: p.protein_per_100g,
      fat_per_100g: p.fat_per_100g,
      carbs_per_100g: p.carbs_per_100g,
      fiber_per_100g: p.fiber_per_100g,
      allowed_substitutes: toStringArray(p.allowed_substitutes),
    };
    return acc;
  }, {} as ProductMap);

  const recipes = await prisma.recipe.findMany({
    include: {
      ingredients: {
        include: {
          product: true,
        },
      },
    },
  });

  const recipesByMeal: Record<MealType, RecipeWithIngredients[]> = {
    breakfast: [],
    lunch: [],
    dinner: [],
    snack: [],
  };
  for (const r of recipes as DbRecipeWithIngredients[]) {
    if (!isMealType(r.mealType)) continue;
    const normalized: RecipeWithIngredients = {
      id: r.id,
      name: r.name,
      mealType: r.mealType,
      instructions: r.instructions,
      tags: r.tags,
      description: r.description,
      ingredients: r.ingredients.map((ing) => ({
        productId: ing.productId,
        amount_g: ing.amount_g,
        product: {
          id: ing.product.id,
          kcal_per_100g: ing.product.kcal_per_100g,
          protein_per_100g: ing.product.protein_per_100g,
          fat_per_100g: ing.product.fat_per_100g,
          carbs_per_100g: ing.product.carbs_per_100g,
          fiber_per_100g: ing.product.fiber_per_100g,
          allowed_substitutes: toStringArray(ing.product.allowed_substitutes),
        },
      })),
    };
    const substituted = substituteIngredients(normalized, excluded, productMap) ?? null;
    if (!substituted) continue;
    recipesByMeal[r.mealType].push(substituted);
  }

  for (const mealType of MEAL_TYPES) {
    if (!recipesByMeal[mealType].length) {
      throw new Error(`No valid recipes available for meal type: ${mealType}`);
    }
  }

  const days: Date[] = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d));
  }

  const planMeals: { date: Date; recipeId: string; mealType: string }[] = [];
  for (const day of days) {
    let selected: RecipeWithIngredients[] | null = null;
    const attempts = 30;
    for (let i = 0; i < attempts; i++) {
      const attemptSelection: RecipeWithIngredients[] = [];
      for (const meal of MEAL_TYPES) {
        const pool = recipesByMeal[meal];
        const pick = pool[Math.floor(Math.random() * pool.length)];
        attemptSelection.push(pick);
      }
      const totals = attemptSelection.reduce(
        (acc, r) => {
          const m = computeRecipeMacros(r);
          return {
            kcal: acc.kcal + m.kcal,
            protein: acc.protein + m.protein,
            fat: acc.fat + m.fat,
            carbs: acc.carbs + m.carbs,
            fiber: acc.fiber + m.fiber,
          };
        },
        { kcal: 0, protein: 0, fat: 0, carbs: 0, fiber: 0 }
      );
      if (isWithinTargets(totals, parsed.calorieTarget, parsed.proteinTarget)) {
        selected = attemptSelection;
        break;
      }
    }

    if (!selected) {
      const dayLabel = day.toISOString().slice(0, 10);
      throw new Error(`Unable to generate a valid meal set for ${dayLabel} with current constraints`);
    }

    for (const meal of selected) {
      planMeals.push({ date: new Date(day), recipeId: meal.id, mealType: meal.mealType });
    }
  }

  const plan = await prisma.plan.create({
    data: {
      userId: parsed.userId,
      startDate: start,
      endDate: end,
      calorieTarget: parsed.calorieTarget,
      proteinTarget: parsed.proteinTarget,
      meals: {
        create: planMeals,
      },
    },
    include: { meals: true },
  });

  return plan;
}
