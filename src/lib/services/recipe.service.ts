import { prisma } from "../db";
import { recipeSchema } from "../validation/schemas";

export const recipeService = {
  async list() {
    return prisma.recipe.findMany({ include: { ingredients: true }, orderBy: { name: "asc" } });
  },
  async upsertMany(rawRecipes: unknown[]) {
    for (const raw of rawRecipes) {
      const parsed = recipeSchema.safeParse(raw);
      if (!parsed.success) continue;
      const recipe = parsed.data;
      const recipeId = recipe.id ?? crypto.randomUUID();
      await prisma.recipe.upsert({
        where: { id: recipeId },
        update: {
          name: recipe.name,
          description: recipe.description,
          mealType: recipe.mealType,
          tags: recipe.tags,
          instructions: recipe.instructions,
          ingredients: {
            deleteMany: {},
            create: recipe.ingredients.map((ing) => ({
              productId: ing.productId,
              amount_g: ing.amount_g,
            })),
          },
        },
        create: {
          id: recipeId,
          name: recipe.name,
          description: recipe.description,
          mealType: recipe.mealType,
          tags: recipe.tags,
          instructions: recipe.instructions,
          ingredients: {
            create: recipe.ingredients.map((ing) => ({
              productId: ing.productId,
              amount_g: ing.amount_g,
            })),
          },
        },
      });
    }
  },
};
