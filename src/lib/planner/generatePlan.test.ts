import { describe, expect, it } from "vitest";
import {
  computeRecipeMacros,
  isWithinTargets,
  substituteIngredients,
  type RecipeWithIngredients,
} from "./generatePlan";

function buildRecipe(): RecipeWithIngredients {
  return {
    id: "r1",
    name: "Egg Bowl",
    mealType: "breakfast",
    instructions: [],
    tags: [],
    description: "",
    ingredients: [
      {
        productId: "egg",
        amount_g: 100,
        product: {
          id: "egg",
          kcal_per_100g: 155,
          protein_per_100g: 13,
          fat_per_100g: 11,
          carbs_per_100g: 1,
          fiber_per_100g: 0,
          allowed_substitutes: ["tofu"],
        },
      },
      {
        productId: "rice",
        amount_g: 150,
        product: {
          id: "rice",
          kcal_per_100g: 130,
          protein_per_100g: 2.7,
          fat_per_100g: 0.3,
          carbs_per_100g: 28,
          fiber_per_100g: 0.4,
          allowed_substitutes: [],
        },
      },
    ],
  };
}

describe("planner helpers", () => {
  it("computes recipe macros from ingredient amounts", () => {
    const recipe = buildRecipe();
    const macro = computeRecipeMacros(recipe);
    expect(macro.kcal).toBeCloseTo(350, 2);
    expect(macro.protein).toBeCloseTo(17.05, 2);
  });

  it("substitutes excluded ingredients with allowed alternatives", () => {
    const recipe = buildRecipe();
    const substituted = substituteIngredients(
      recipe,
      new Set(["egg"]),
      {
        egg: {
          kcal_per_100g: 155,
          protein_per_100g: 13,
          fat_per_100g: 11,
          carbs_per_100g: 1,
          fiber_per_100g: 0,
          allowed_substitutes: ["tofu"],
        },
        tofu: {
          kcal_per_100g: 144,
          protein_per_100g: 17.3,
          fat_per_100g: 8.7,
          carbs_per_100g: 2.8,
          fiber_per_100g: 2.3,
          allowed_substitutes: [],
        },
        rice: {
          kcal_per_100g: 130,
          protein_per_100g: 2.7,
          fat_per_100g: 0.3,
          carbs_per_100g: 28,
          fiber_per_100g: 0.4,
          allowed_substitutes: [],
        },
      }
    );

    expect(substituted).not.toBeNull();
    expect(substituted?.ingredients[0]?.productId).toBe("tofu");
  });

  it("checks daily targets with ±5% kcal and minimum protein", () => {
    expect(isWithinTargets({ kcal: 1980, protein: 150, fat: 0, carbs: 0, fiber: 0 }, 2000, 140)).toBe(true);
    expect(isWithinTargets({ kcal: 1800, protein: 170, fat: 0, carbs: 0, fiber: 0 }, 2000, 140)).toBe(false);
    expect(isWithinTargets({ kcal: 2000, protein: 120, fat: 0, carbs: 0, fiber: 0 }, 2000, 140)).toBe(false);
  });
});
