import { prisma } from "@/lib/db";
import { BottomNav } from "@/components/BottomNav";

export default async function ProductsPage() {
  const products = await prisma.product.findMany({ orderBy: { name: "asc" } });
  return (
    <main className="pb-20 px-4 pt-6 space-y-4">
      <h1 className="text-2xl font-semibold">Produkte</h1>
      <div className="space-y-2">
        {products.map((p: (typeof products)[number]) => (
          <div
            key={p.id}
            className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 flex justify-between items-center"
          >
            <div>
              <div className="font-semibold">{p.name}</div>
              <div className="text-sm text-[var(--muted)]">{p.category}</div>
            </div>
            <div className="text-sm text-[var(--muted)]">{p.kcal_per_100g} kcal / {p.protein_per_100g} g P</div>
          </div>
        ))}
        {products.length === 0 && <div className="text-[var(--muted)]">Keine Produkte importiert.</div>}
      </div>
      <BottomNav />
    </main>
  );
}
