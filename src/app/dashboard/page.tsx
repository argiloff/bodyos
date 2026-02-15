import { getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { BottomNav } from "@/components/BottomNav";
import { Calendar, Dumbbell, ChefHat, Upload } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await getCurrentSession();
  const userId = session?.user?.id;
  if (!userId) return null;

  const [profile, plans] = await Promise.all([
    prisma.profile.findUnique({ where: { userId } }),
    prisma.plan.findMany({ where: { userId }, orderBy: { startDate: "desc" }, take: 5 }),
  ]);

  return (
    <main className="pb-20 px-4 pt-6 space-y-6">
      <h1 className="text-2xl font-semibold">Willkommen</h1>
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
          <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
            <Dumbbell size={16} /> Ziel Makros
          </div>
          <div className="mt-2 text-lg font-semibold">
            {profile?.calorieTarget ?? "-"} kcal / {profile?.proteinTarget ?? "-"} g Protein
          </div>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
          <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
            <Calendar size={16} /> Letzte Pläne
          </div>
          <div className="mt-2 text-lg font-semibold">{plans.length}</div>
        </div>
        <Link
          href="/planner"
          className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 flex items-center justify-between"
        >
          <div>
            <div className="text-sm text-[var(--muted)]">Neuen Plan erstellen</div>
            <div className="text-lg font-semibold">Planer</div>
          </div>
          <ChefHat className="text-[var(--accent)]" />
        </Link>
        <Link
          href="/import"
          className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 flex items-center justify-between"
        >
          <div>
            <div className="text-sm text-[var(--muted)]">Daten importieren</div>
            <div className="text-lg font-semibold">Import</div>
          </div>
          <Upload className="text-[var(--accent)]" />
        </Link>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Letzte Pläne</h2>
          <Link href="/planner" className="text-sm text-[var(--accent)]">
            Alle ansehen
          </Link>
        </div>
        <div className="space-y-2 text-sm">
          {plans.map((p: (typeof plans)[number]) => (
            <div key={p.id} className="flex justify-between border-b border-[var(--border)]/60 pb-2">
              <div>
                {new Date(p.startDate).toLocaleDateString()} - {new Date(p.endDate).toLocaleDateString()}
              </div>
              <div className="text-[var(--muted)]">{p.calorieTarget} kcal / {p.proteinTarget} g</div>
            </div>
          ))}
          {plans.length === 0 && <div className="text-[var(--muted)]">Noch keine Pläne</div>}
        </div>
      </section>
      <BottomNav />
    </main>
  );
}
