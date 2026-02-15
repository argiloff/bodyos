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

type RecipeIngredientWithProduct = {
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

type RecipeWithIngredients = {
  id: string;
  name: string;
  mealType: string;
  instructions: unknown;
  tags: unknown;
  description: string;
  ingredients: RecipeIngredientWithProduct[];
};

type Macro = {
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
};

const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"] as const;

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

function computeRecipeMacros(recipe: RecipeWithIngredients) {
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

function substituteIngredients(
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

function isWithinTargets(total: Macro, calorieTarget: number, proteinTarget: number) {
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
  const excluded = new Set<string>(
    Array.isArray(profile?.excludedProducts) ? (profile?.excludedProducts as string[]) : []
  );

  const products = await prisma.product.findMany();
  const productMap = products.reduce((acc: ProductMap, p: (typeof products)[number]) => {
    acc[p.id] = {
      kcal_per_100g: p.kcal_per_100g,
      protein_per_100g: p.protein_per_100g,
      fat_per_100g: p.fat_per_100g,
      carbs_per_100g: p.carbs_per_100g,
      fiber_per_100g: p.fiber_per_100g,
      allowed_substitutes: (p.allowed_substitutes as string[]) ?? [],
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

  const recipesByMeal: Record<string, RecipeWithIngredients[]> = {};
  for (const r of recipes) {
    const substituted = substituteIngredients(r as any, excluded, productMap) ?? null;
    if (!substituted) continue;
    recipesByMeal[r.mealType] = recipesByMeal[r.mealType] || [];
    recipesByMeal[r.mealType].push(substituted);
  }

  const days: Date[] = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d));
  }

  const planMeals: { date: Date; recipeId: string; mealType: string }[] = [];
  for (const day of days) {
    const selected: RecipeWithIngredients[] = [];
    const attempts = 30;
    for (let i = 0; i < attempts; i++) {
      selected.length = 0;
      for (const meal of MEAL_TYPES) {
        const pool = recipesByMeal[meal] ?? [];
        if (!pool.length) continue;
        const pick = pool[Math.floor(Math.random() * pool.length)];
        selected.push(pick);
      }
      const totals = selected.reduce(
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
        break;
      }
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
