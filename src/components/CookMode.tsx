"use client";

import { useState } from "react";

export function CookMode({ steps, ingredients }: { steps: string[]; ingredients: { name: string; amount_g: number }[] }) {
  const [current, setCurrent] = useState(0);
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-(--card) p-4">
        <div className="text-sm text-muted mb-2">Schritt {current + 1} / {steps.length}</div>
        <div className="text-lg font-semibold leading-relaxed min-h-[120px]">{steps[current]}</div>
        <div className="flex gap-3 mt-3">
          <button
            type="button"
            onClick={() => setCurrent((c) => Math.max(0, c - 1))}
            className="flex-1 rounded-xl border border-border px-4 py-2 text-sm"
          >
            Zurück
          </button>
          <button
            type="button"
            onClick={() => setCurrent((c) => Math.min(steps.length - 1, c + 1))}
            className="flex-1 rounded-xl bg-accent px-4 py-2 text-black font-semibold hover:bg-(--accent-strong)"
          >
            Weiter
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-(--card) p-4">
        <h3 className="font-semibold mb-2">Zutaten</h3>
        <div className="space-y-2">
          {ingredients.map((ing) => (
            <label key={ing.name} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={!!checked[ing.name]}
                onChange={(e) => setChecked((m) => ({ ...m, [ing.name]: e.target.checked }))}
                className="h-4 w-4 rounded border-border"
              />
              <span>{ing.name} – {ing.amount_g} g</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
