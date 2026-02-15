import { NextResponse } from "next/server";
import { importPayloadSchema } from "@/lib/validation/schemas";
import { productService } from "@/lib/services/product.service";
import { recipeService } from "@/lib/services/recipe.service";

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = importPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", issues: parsed.error.issues }, { status: 400 });
  }
  const { products, recipes } = parsed.data;
  await productService.upsertMany(products);
  await recipeService.upsertMany(recipes);
  return NextResponse.json({ ok: true });
}
