"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { BackendStatus } from "@/components/auth/backend-status";
import { PasswordField } from "@/components/auth/password-field";
import { SocialLoginButtons } from "@/components/auth/social-login-buttons";
import { useAuth } from "@/components/auth/auth-provider";

export function LoginForm() {
  const { login, backend } = useAuth();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("customer@nexora.demo");
  const [password, setPassword] = useState("NexoraDemo@123");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email.includes("@") || password.length < 6) {
      setError("Enter a valid email and password.");
      return;
    }

    setBusy(true);
    setError("");

    try {
      await login({ email, password, remember: true });
      const next = searchParams.get("next");
      window.location.assign(next?.startsWith("/") ? next : "/account");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Sign in failed.");
      setBusy(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Sign in to Nexora"
      description="Track real orders, manage your account and checkout with a secure server session."
      footer={
        <>
          New here?{" "}
          <Link href="/register" className="font-black text-black">
            Create an account →
          </Link>
        </>
      }
    >
      <BackendStatus />
      <SocialLoginButtons />
      <div className="my-6 flex items-center gap-3 text-[11px] font-black uppercase tracking-[.18em] text-black/35">
        <span className="h-px flex-1 bg-black/10" />
        or continue with email
        <span className="h-px flex-1 bg-black/10" />
      </div>

      <form onSubmit={submit} className="space-y-4">
        <label className="block text-sm font-bold">
          Email address
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            autoComplete="email"
            className="mt-2 h-12 w-full rounded-2xl border border-black/15 bg-[#f8f8f6] px-4 outline-none transition focus:border-black"
          />
        </label>

        <PasswordField value={password} onChange={setPassword} autoComplete="current-password" />

        <div className="flex items-center justify-between gap-4 text-sm">
          <label className="flex items-center gap-2 text-black/60">
            <input type="checkbox" defaultChecked /> Keep me signed in
          </label>
          <Link href="/forgot-password" className="font-black">
            Forgot password?
          </Link>
        </div>

        {error ? (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p>
        ) : null}

        <button
          disabled={busy || backend !== "ready"}
          className="h-12 w-full rounded-full bg-black px-5 text-sm font-black text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? "Signing in…" : "Sign in securely"}
        </button>

        <p className="text-xs leading-5 text-black/40">
          After the database seed, demo customer login is customer@nexora.demo / NexoraDemo@123.
        </p>
      </form>
    </AuthShell>
  );
}
