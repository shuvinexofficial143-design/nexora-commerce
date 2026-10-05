"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function PersonalAdminLogin() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!username.trim() || !password) {
      setError("Username and password are required.");
      return;
    }

    setBusy(true);
    setError("");

    try {
      const response = await fetch("/api/admin-app/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ username, password }),
      });

      const payload = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || "Admin login failed.");
      }

      router.replace("/admin");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Admin login failed.");
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#11110f] px-4 py-10 text-white">
      <div className="mx-auto flex min-h-[80vh] max-w-md items-center">
        <section className="w-full rounded-[32px] border border-white/10 bg-white/[.06] p-6 shadow-2xl backdrop-blur sm:p-8">
          <div className="mb-8">
            <p className="text-xs font-black uppercase tracking-[.2em] text-[#d7ff47]">Private owner access</p>
            <h1 className="mt-2 text-3xl font-black tracking-[-.04em]">NEXORA Admin</h1>
            <p className="mt-2 text-sm leading-6 text-white/50">
              Personal dashboard. Only the configured owner username and password can sign in.
            </p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <label className="block text-sm font-bold">
              Username
              <input
                autoFocus
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                autoComplete="username"
                className="mt-2 h-12 w-full rounded-2xl border border-white/15 bg-white/10 px-4 text-white outline-none placeholder:text-white/25 focus:border-[#d7ff47]"
                placeholder="Owner username"
              />
            </label>

            <label className="block text-sm font-bold">
              Password
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                autoComplete="current-password"
                className="mt-2 h-12 w-full rounded-2xl border border-white/15 bg-white/10 px-4 text-white outline-none placeholder:text-white/25 focus:border-[#d7ff47]"
                placeholder="••••••••"
              />
            </label>

            {error ? (
              <p className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-200">
                {error}
              </p>
            ) : null}

            <button
              disabled={busy}
              className="h-12 w-full rounded-full bg-[#d7ff47] text-sm font-black text-black transition hover:bg-[#c7ed37] disabled:cursor-wait disabled:opacity-60"
            >
              {busy ? "Signing in…" : "Open admin panel"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
