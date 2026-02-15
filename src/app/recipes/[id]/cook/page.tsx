import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { CookMode } from "@/components/CookMode";

export default async function CookRecipePage({ params }: { params: { id: string } }) {
  const recipe = await prisma.recipe.findUnique({
    where: { id: params.id },
    include: {
      ingredients: {
        include: { product: true },
      },
    },
  });

  if (!recipe) notFound();

  const steps = Array.isArray(recipe.instructions) ? (recipe.instructions as string[]) : [];
  const ingredients = recipe.ingredients.map((ing: (typeof recipe.ingredients)[number]) => ({
    name: ing.product.name,
    amount_g: ing.amount_g,
  }));

  return (
    <main className="px-4 py-6 space-y-4">
      <Link href="/recipes" className="text-sm text-muted">
        ← Zurück zu Rezepten
      </Link>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{recipe.name}</h1>
        <span className="text-sm text-muted capitalize">{recipe.mealType}</span>
      </div>
      <CookMode steps={steps} ingredients={ingredients} />
    </main>
  );
}
