"use client";

import { useState } from "react";

const INITIAL_START_DATE = new Date().toISOString().slice(0, 10);
const INITIAL_END_DATE = (() => {
  const date = new Date();
  date.setDate(date.getDate() + 6);
  return date.toISOString().slice(0, 10);
})();

export function PlannerForm({
  defaults,
}: {
  defaults: { calorieTarget?: number | null; proteinTarget?: number | null };
}) {
  const [startDate, setStartDate] = useState<string>(INITIAL_START_DATE);
  const [endDate, setEndDate] = useState<string>(INITIAL_END_DATE);
  const [calorieTarget, setCalorieTarget] = useState<number | string>(defaults.calorieTarget ?? 2000);
  const [proteinTarget, setProteinTarget] = useState<number | string>(defaults.proteinTarget ?? 140);
  const [status, setStatus] = useState<string>("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("Plan wird erstellt...");
    const res = await fetch("/api/planner", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startDate, endDate, calorieTarget: Number(calorieTarget), proteinTarget: Number(proteinTarget) }),
    });
    if (!res.ok) {
      setStatus("Fehler beim Erstellen");
    } else {
      setStatus("Plan gespeichert");
    }
  };

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="grid grid-cols-2 gap-3">
        <label className="text-sm text-muted flex flex-col gap-1">
          Start
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="rounded-xl border border-border bg-[var(--card)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </label>
        <label className="text-sm text-muted flex flex-col gap-1">
          Ende
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="rounded-xl border border-border bg-[var(--card)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </label>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label className="text-sm text-muted flex flex-col gap-1">
          Kalorienziel
          <input
            type="number"
            value={calorieTarget}
            onChange={(e) => setCalorieTarget(e.target.value)}
            className="rounded-xl border border-border bg-[var(--card)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </label>
        <label className="text-sm text-muted flex flex-col gap-1">
          Proteinziel (g)
          <input
            type="number"
            value={proteinTarget}
            onChange={(e) => setProteinTarget(e.target.value)}
            className="rounded-xl border border-border bg-[var(--card)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </label>
      </div>
      <button
        type="submit"
        className="w-full rounded-xl bg-accent px-4 py-3 text-black font-semibold hover:bg-(--accent-strong) transition"
      >
        Plan generieren
      </button>
      {status && <div className="text-sm text-muted">{status}</div>}
    </form>
  );
}
