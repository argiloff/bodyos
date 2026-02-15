import { BottomNav } from "@/components/BottomNav";
import { getCurrentSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const session = await getCurrentSession();
  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <main className="pb-20 px-4 pt-6 space-y-4">
      <h1 className="text-2xl font-semibold">Einstellungen</h1>
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
        <div className="font-semibold">Account</div>
        <div className="text-sm text-[var(--muted)] mt-1">{session.user.email}</div>
      </div>
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
        <div className="font-semibold">App</div>
        <div className="text-sm text-[var(--muted)] mt-1">
          Weitere Einstellungen können hier schrittweise ergänzt werden.
        </div>
      </div>
      <BottomNav />
    </main>
  );
}
