import Link from "next/link";
import { prisma } from "@/lib/db";
import { BottomNav } from "@/components/BottomNav";
import { ChefHat } from "lucide-react";

export default async function RecipesPage() {
  const recipes = await prisma.recipe.findMany({ orderBy: { name: "asc" } });
  return (
    <main className="pb-20 px-4 pt-6 space-y-4">
      <h1 className="text-2xl font-semibold">Rezepte</h1>
      <div className="space-y-2">
        {recipes.map((r: (typeof recipes)[number]) => (
          <Link
            key={r.id}
            href={`/recipes/${r.id}/cook`}
            className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 flex justify-between items-center"
          >
            <div>
              <div className="font-semibold">{r.name}</div>
              <div className="text-sm text-[var(--muted)] capitalize">{r.mealType}</div>
            </div>
            <ChefHat className="text-[var(--accent)]" />
          </Link>
        ))}
        {recipes.length === 0 && <div className="text-[var(--muted)]">Keine Rezepte importiert.</div>}
      </div>
      <BottomNav />
    </main>
  );
}
