"use client";

import { useEffect, useState } from "react";

type ImportStats = {
  products: number;
  recipes: number;
  plans: number;
  planMeals: number;
  recipeIngredients: number;
  users: number;
  profiles: number;
};

const emptyStats: ImportStats = {
  products: 0,
  recipes: 0,
  plans: 0,
  planMeals: 0,
  recipeIngredients: 0,
  users: 0,
  profiles: 0,
};

export function ImportManager() {
  const [payload, setPayload] = useState("");
  const [status, setStatus] = useState("");
  const [stats, setStats] = useState<ImportStats>(emptyStats);
  const [loadingStats, setLoadingStats] = useState(true);

  const refreshStats = async () => {
    setLoadingStats(true);
    const res = await fetch("/api/import", { method: "GET" });
    if (res.ok) {
      const json = (await res.json()) as ImportStats;
      setStats(json);
    }
    setLoadingStats(false);
  };

  useEffect(() => {
    void refreshStats();
  }, []);

  const onFileUpload = async (file: File) => {
    const text = await file.text();
    setPayload(text);
    setStatus(`Datei geladen: ${file.name}`);
  };

  const onImport = async () => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(payload);
    } catch {
      setStatus("Ungültiges JSON.");
      return;
    }

    setStatus("Import läuft...");
    const res = await fetch("/api/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed),
    });
    const data = (await res.json().catch(() => null)) as
      | {
          error?: string;
          imported?: { products: { processed: number; skipped: number }; recipes: { processed: number; skipped: number } };
        }
      | null;

    if (!res.ok) {
      setStatus(data?.error ?? "Import fehlgeschlagen.");
      return;
    }

    const productText = data?.imported?.products
      ? `${data.imported.products.processed} Produkte (${data.imported.products.skipped} übersprungen)`
      : "";
    const recipeText = data?.imported?.recipes
      ? `${data.imported.recipes.processed} Rezepte (${data.imported.recipes.skipped} übersprungen)`
      : "";

    setStatus(`Import erfolgreich: ${productText}, ${recipeText}`);
    await refreshStats();
  };

  const onDelete = async (mode: "soft" | "hard") => {
    const message =
      mode === "hard"
        ? "Wirklich ALLES löschen? (Produkte, Rezepte, Pläne, Profile, Benutzerkonten)"
        : "Wirklich alle Produkt-/Rezept-/Planungsdaten löschen?";
    if (!window.confirm(message)) return;

    setStatus("Löschen läuft...");
    const res = await fetch(`/api/import${mode === "hard" ? "?mode=hard" : ""}`, {
      method: "DELETE",
    });
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    if (!res.ok) {
      setStatus(data?.error ?? "Löschen fehlgeschlagen.");
      return;
    }

    setStatus(mode === "hard" ? "Alles wurde gelöscht." : "Import- und Planungsdaten wurden gelöscht.");
    await refreshStats();
  };

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
        <h2 className="text-lg font-semibold">Import (JSON)</h2>
        <p className="text-sm text-muted">
          Format: {"{"}"products": [...], "recipes": [...]{"}"}. Zutaten können <code>productId</code> oder{" "}
          <code>product_id</code> verwenden.
        </p>
        <a
          href="/data/import-100-recipes.json"
          className="inline-flex rounded-xl border border-border px-3 py-2 text-sm text-muted hover:text-white"
          download
        >
          Beispiel herunterladen (100 Rezepte)
        </a>
        <input
          type="file"
          accept="application/json"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void onFileUpload(file);
          }}
          className="block w-full text-sm text-muted file:mr-3 file:rounded-xl file:border file:border-border file:bg-card file:px-3 file:py-2 file:text-sm file:text-white"
        />
        <textarea
          value={payload}
          onChange={(e) => setPayload(e.target.value)}
          rows={12}
          className="w-full rounded-xl border border-border bg-[var(--card)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          placeholder='{"products":[...],"recipes":[...]}'
        />
        <button
          type="button"
          onClick={() => void onImport()}
          className="w-full rounded-xl bg-accent px-4 py-3 text-black font-semibold hover:bg-(--accent-strong) transition"
        >
          JSON importieren
        </button>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
        <h2 className="text-lg font-semibold">Daten löschen</h2>
        <div className="text-sm text-muted">
          {loadingStats ? "Lade Statistik..." : `Produkte: ${stats.products}, Rezepte: ${stats.recipes}, Pläne: ${stats.plans}`}
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => void onDelete("soft")}
            className="rounded-xl border border-border px-4 py-3 text-sm font-semibold hover:bg-neutral-800"
          >
            Import-/Planungsdaten löschen
          </button>
          <button
            type="button"
            onClick={() => void onDelete("hard")}
            className="rounded-xl bg-red-500/90 px-4 py-3 text-sm font-semibold text-white hover:bg-red-500"
          >
            Alles löschen (hard)
          </button>
        </div>
      </div>

      {status && <p className="text-sm text-muted">{status}</p>}
    </section>
  );
}
