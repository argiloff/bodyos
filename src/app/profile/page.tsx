"use client";

import { useEffect, useState } from "react";
import { BottomNav } from "@/components/BottomNav";

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/profile").then((r) => r.json()).then((data) => {
      setProfile(data || {});
      setLoading(false);
    });
  }, []);

  const update = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("Speichere...");
    await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });
    setMessage("Gespeichert");
  };

  const updateField = (key: string, value: any) => {
    setProfile((p: any) => ({ ...(p || {}), [key]: value }));
  };

  if (loading) return <main className="p-4">Lädt...</main>;

  return (
    <main className="pb-20 px-4 pt-6 space-y-4">
      <h1 className="text-2xl font-semibold">Profil</h1>
      <form className="space-y-3" onSubmit={update}>
        <div className="grid grid-cols-2 gap-3">
          {[
            { key: "weight", label: "Gewicht (kg)" },
            { key: "height", label: "Größe (cm)" },
            { key: "age", label: "Alter" },
            { key: "goalWeight", label: "Zielgewicht" },
            { key: "calorieTarget", label: "Kalorienziel" },
            { key: "proteinTarget", label: "Proteinziel" },
          ].map((f) => (
            <label key={f.key} className="text-sm text-muted flex flex-col gap-1">
              {f.label}
              <input
                type="number"
                value={profile?.[f.key] ?? ""}
                onChange={(e) => updateField(f.key, Number(e.target.value))}
                className="rounded-xl border border-border bg-(--card) px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </label>
          ))}
        </div>
        <label className="text-sm text-muted flex flex-col gap-1">
          Ausgeschlossene Produkte (IDs, komma-separiert)
          <input
            type="text"
            value={(profile?.excludedProducts || []).join(",")}
            onChange={(e) => updateField("excludedProducts", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
            className="rounded-xl border border-border bg-(--card) px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </label>
        <button type="submit" className="w-full rounded-xl bg-accent px-4 py-3 text-black font-semibold hover:bg-(--accent-strong) transition">
          Speichern
        </button>
        {message && <div className="text-sm text-muted">{message}</div>}
      </form>
      <BottomNav />
    </main>
  );
}
