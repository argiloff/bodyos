import { NextResponse } from "next/server";
import { importPayloadSchema } from "@/lib/validation/schemas";
import { productService } from "@/lib/services/product.service";
import { recipeService } from "@/lib/services/recipe.service";
import { prisma } from "@/lib/db";
import { requireUser, UnauthorizedError } from "@/lib/auth/session";

async function getCounts() {
  const [products, recipes, plans, planMeals, recipeIngredients, users, profiles] = await Promise.all([
    prisma.product.count(),
    prisma.recipe.count(),
    prisma.plan.count(),
    prisma.planMeal.count(),
    prisma.recipeIngredient.count(),
    prisma.user.count(),
    prisma.profile.count(),
  ]);

  return { products, recipes, plans, planMeals, recipeIngredients, users, profiles };
}

export async function GET() {
  try {
    await requireUser();
    const counts = await getCounts();
    return NextResponse.json(counts);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to load import stats" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await requireUser(req);
    const body = await req.json();
    const parsed = importPayloadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload", issues: parsed.error.issues }, { status: 400 });
    }
    const { products, recipes } = parsed.data;
    const [productResult, recipeResult] = await Promise.all([
      productService.upsertMany(products),
      recipeService.upsertMany(recipes),
    ]);
    const counts = await getCounts();
    return NextResponse.json({
      ok: true,
      imported: {
        products: productResult,
        recipes: recipeResult,
      },
      counts,
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Import failed" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await requireUser(req);
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("mode");

    if (mode === "hard") {
      await prisma.$transaction([
        prisma.planMeal.deleteMany(),
        prisma.recipeIngredient.deleteMany(),
        prisma.session.deleteMany(),
        prisma.account.deleteMany(),
        prisma.verificationToken.deleteMany(),
        prisma.plan.deleteMany(),
        prisma.recipe.deleteMany(),
        prisma.product.deleteMany(),
        prisma.profile.deleteMany(),
        prisma.user.deleteMany(),
      ]);
    } else {
      await prisma.$transaction([
        prisma.planMeal.deleteMany(),
        prisma.recipeIngredient.deleteMany(),
        prisma.plan.deleteMany(),
        prisma.recipe.deleteMany(),
        prisma.product.deleteMany(),
      ]);

      await prisma.profile.updateMany({
        data: { excludedProducts: [] },
      });
    }

    const counts = await getCounts();
    return NextResponse.json({ ok: true, mode: mode === "hard" ? "hard" : "soft", counts });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
