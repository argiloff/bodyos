import { z } from "zod";

export const productSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  category: z.string().min(1),
  kcal_per_100g: z.number().int().nonnegative(),
  protein_per_100g: z.number().nonnegative(),
  fat_per_100g: z.number().nonnegative(),
  carbs_per_100g: z.number().nonnegative(),
  fiber_per_100g: z.number().nonnegative(),
  allowed_substitutes: z.array(z.string()).default([]),
});

export const recipeIngredientSchema = z.object({
  productId: z.string().min(1),
  amount_g: z.number().int().positive(),
});

export const recipeSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  description: z.string().default(""),
  mealType: z.enum(["breakfast", "lunch", "dinner", "snack"]),
  tags: z.array(z.string()).default([]),
  instructions: z.array(z.string()).default([]),
  ingredients: z.array(recipeIngredientSchema).min(1),
});

export const importPayloadSchema = z.object({
  products: z.array(productSchema),
  recipes: z.array(recipeSchema),
});

export const plannerInputSchema = z.object({
  userId: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  calorieTarget: z.number().int().positive(),
  proteinTarget: z.number().int().positive(),
});
