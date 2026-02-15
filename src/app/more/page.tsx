import Link from "next/link";
import { BottomNav } from "@/components/BottomNav";
import { getCurrentSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function MorePage() {
  const session = await getCurrentSession();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const items = [
    {
      href: "/import",
      title: "Import",
      description: "JSON importieren und Daten zurücksetzen",
    },
    {
      href: "/profile",
      title: "Profil",
      description: "Körperdaten, Ziele und Ausschlüsse verwalten",
    },
    {
      href: "/settings",
      title: "Einstellungen",
      description: "App-Einstellungen und Kontooptionen",
    },
  ];

  return (
    <main className="pb-20 px-4 pt-6 space-y-4">
      <h1 className="text-2xl font-semibold">Mehr</h1>
      <div className="space-y-2">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="block rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4"
          >
            <div className="font-semibold">{item.title}</div>
            <div className="text-sm text-[var(--muted)]">{item.description}</div>
          </Link>
        ))}
      </div>
      <BottomNav />
    </main>
  );
}
