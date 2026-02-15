import { prisma } from "../db";

export const groceryService = {
  async listForRange(userId: string, start: Date, end: Date) {
    const meals = await prisma.planMeal.findMany({
      where: {
        plan: { userId },
        date: { gte: start, lte: end },
      },
      include: {
        recipe: {
          include: {
            ingredients: {
              include: { product: true },
            },
          },
        },
      },
    });

    const totals = new Map<
      string,
      {
        name: string;
        category: string;
        amount_g: number;
      }
    >();

    for (const meal of meals) {
      for (const ing of meal.recipe.ingredients) {
        const existing = totals.get(ing.productId);
        totals.set(ing.productId, {
          name: ing.product.name,
          category: ing.product.category,
          amount_g: (existing?.amount_g ?? 0) + ing.amount_g,
        });
      }
    }

    return Array.from(totals.entries()).map(([productId, v]) => ({
      productId,
      ...v,
    }));
  },
};
