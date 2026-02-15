import { auth } from "@/lib/auth/options";
import { groceryService } from "@/lib/services/grocery.service";
import { BottomNav } from "@/components/BottomNav";
import { redirect } from "next/navigation";

export default async function GroceryPage({
  searchParams,
}: {
  searchParams: { start?: string; end?: string };
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const start = searchParams.start ? new Date(searchParams.start) : null;
  const end = searchParams.end ? new Date(searchParams.end) : null;
  let list: Awaited<ReturnType<typeof groceryService.listForRange>> = [];
  if (start && end) {
    list = await groceryService.listForRange(session.user.id, start, end);
  }

  const downloadHref = start && end ? `/api/grocery?start=${start.toISOString()}&end=${end.toISOString()}` : "";

  return (
    <main className="pb-20 px-4 pt-6 space-y-4">
      <h1 className="text-2xl font-semibold">Einkaufsliste</h1>
      {!start || !end ? (
        <p className="text-muted text-sm">
          Wähle zuerst einen Plan im Planner aus. Der Link "Einkaufsliste" öffnet diese Seite automatisch mit den passenden
          Daten.
        </p>
      ) : (
        <>
          <div className="flex items-center justify-between text-sm text-muted">
            <span>
              Zeitraum: {start.toLocaleDateString()} – {end.toLocaleDateString()}
            </span>
            <a
              href={downloadHref}
              className="rounded-xl border border-border px-3 py-1 text-xs text-muted hover:text-white"
              download="grocery-list.json"
            >
              JSON Export
            </a>
          </div>
          <div className="space-y-2">
            {list.map((item) => (
              <div key={item.productId} className="rounded-2xl border border-border bg-card p-4 flex justify-between">
                <div>
                  <div className="font-semibold">{item.name}</div>
                  <div className="text-xs text-muted">{item.category}</div>
                </div>
                <div className="text-sm text-muted">{item.amount_g} g</div>
              </div>
            ))}
            {list.length === 0 && <div className="text-muted">Keine Zutaten gefunden.</div>}
          </div>
        </>
      )}
      <BottomNav />
    </main>
  );
}
