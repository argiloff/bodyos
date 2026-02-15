"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const error = searchParams.get("error");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await signIn("credentials", {
      redirect: true,
      email,
      password,
      callbackUrl: "/dashboard",
    });
  };

  return (
    <main className="min-h-dvh flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-[var(--card)] p-6 shadow-xl">
        <h1 className="text-2xl font-semibold mb-2">BodyOS Login</h1>
        <p className="text-sm text-[var(--muted)] mb-6">Melde dich mit deinen Zugangsdaten an.</p>
        {error && <div className="text-sm text-red-400 mb-3">Anmeldung fehlgeschlagen</div>}
        <form className="space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="text-sm text-[var(--muted)]">Email</label>
            <input
              className="mt-1 w-full rounded-xl border border-[var(--border)] bg-neutral-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-sm text-[var(--muted)]">Passwort</label>
            <input
              className="mt-1 w-full rounded-xl border border-[var(--border)] bg-neutral-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[var(--accent)] px-4 py-2 text-black font-semibold hover:bg-[var(--accent-strong)] transition"
          >
            {loading ? "Lade..." : "Einloggen"}
          </button>
        </form>
      </div>
    </main>
  );
}
