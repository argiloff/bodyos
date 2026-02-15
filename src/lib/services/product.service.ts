import { prisma } from "../db";
import { productSchema } from "../validation/schemas";

export const productService = {
  async list() {
    return prisma.product.findMany({ orderBy: { name: "asc" } });
  },
  async upsertMany(rawProducts: unknown[]) {
    let processed = 0;
    let skipped = 0;
    for (const raw of rawProducts) {
      const parsed = productSchema.safeParse(raw);
      if (!parsed.success) {
        skipped += 1;
        continue;
      }
      const product = parsed.data;
      await prisma.product.upsert({
        where: { id: product.id },
        update: {
          name: product.name,
          category: product.category,
          kcal_per_100g: product.kcal_per_100g,
          protein_per_100g: product.protein_per_100g,
          fat_per_100g: product.fat_per_100g,
          carbs_per_100g: product.carbs_per_100g,
          fiber_per_100g: product.fiber_per_100g,
          allowed_substitutes: product.allowed_substitutes,
        },
        create: {
          id: product.id,
          name: product.name,
          category: product.category,
          kcal_per_100g: product.kcal_per_100g,
          protein_per_100g: product.protein_per_100g,
          fat_per_100g: product.fat_per_100g,
          carbs_per_100g: product.carbs_per_100g,
          fiber_per_100g: product.fiber_per_100g,
          allowed_substitutes: product.allowed_substitutes,
        },
      });
      processed += 1;
    }
    return { processed, skipped };
  },
};
