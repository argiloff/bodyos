import { BottomNav } from "@/components/BottomNav";
import { ImportManager } from "@/components/ImportManager";
import { getCurrentSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function ImportPage() {
  const session = await getCurrentSession();
  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <main className="pb-20 px-4 pt-6 space-y-4">
      <h1 className="text-2xl font-semibold">Import & Reset</h1>
      <ImportManager />
      <BottomNav />
    </main>
  );
}
