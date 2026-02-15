import { auth } from "@/lib/auth/options";
import { prisma } from "@/lib/db";
import { PlannerForm } from "@/components/PlannerForm";
import { BottomNav } from "@/components/BottomNav";
import Link from "next/link";

export default async function PlannerPage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;
  const profile = await prisma.profile.findUnique({ where: { userId } });
  const plans = await prisma.plan.findMany({ where: { userId }, orderBy: { startDate: "desc" }, include: { meals: true } });
  return (
    <main className="pb-20 px-4 pt-6 space-y-6">
      <h1 className="text-2xl font-semibold">Planer</h1>
      <PlannerForm defaults={{ calorieTarget: profile?.calorieTarget, proteinTarget: profile?.proteinTarget }} />
      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Gespeicherte Pläne</h2>
        {plans.map((p) => (
          <div key={p.id} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 flex justify-between items-center">
            <div>
              <div className="font-semibold">{new Date(p.startDate).toLocaleDateString()} – {new Date(p.endDate).toLocaleDateString()}</div>
              <div className="text-sm text-[var(--muted)]">{p.calorieTarget} kcal / {p.proteinTarget} g</div>
            </div>
            <Link href={`/grocery?start=${p.startDate.toISOString()}&end=${p.endDate.toISOString()}`} className="text-sm text-[var(--accent)]">
              Einkaufsliste
            </Link>
          </div>
        ))}
        {plans.length === 0 && <div className="text-[var(--muted)]">Noch keine Pläne.</div>}
      </section>
      <BottomNav />
    </main>
  );
}
