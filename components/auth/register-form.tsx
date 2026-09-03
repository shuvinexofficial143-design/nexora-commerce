"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { BackendStatus } from "@/components/auth/backend-status";
import { PasswordField } from "@/components/auth/password-field";
import { SocialLoginButtons } from "@/components/auth/social-login-buttons";
import { useAuth } from "@/components/auth/auth-provider";

export function RegisterForm() {
  const { register, backend } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (form.name.trim().length < 2 || !form.email.includes("@") || form.password.length < 8) {
      setError("Use your name, a valid email and a password of at least 8 characters.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await register(form);
      window.location.assign("/account");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Registration failed.");
      setBusy(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Join Prakriti Ganesh"
      title="Create your account"
      description="Save favourite murtis, manage delivery addresses, track festival orders and checkout faster."
      footer={<>Already a member? <Link href="/login" className="font-black text-black">Sign in →</Link></>}
    >
      <BackendStatus />
      <SocialLoginButtons />
      <div className="my-6 flex items-center gap-3 text-[11px] font-black uppercase tracking-[.18em] text-black/35"><span className="h-px flex-1 bg-black/10" />or register with email<span className="h-px flex-1 bg-black/10" /></div>
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-bold sm:col-span-2">Full name<input value={form.name} onChange={(e) => update("name", e.target.value)} autoComplete="name" className="mt-2 h-12 w-full rounded-2xl border border-black/15 bg-[#f8f8f6] px-4 outline-none focus:border-black" /></label>
        <label className="block text-sm font-bold">Email<input value={form.email} onChange={(e) => update("email", e.target.value)} type="email" autoComplete="email" className="mt-2 h-12 w-full rounded-2xl border border-black/15 bg-[#f8f8f6] px-4 outline-none focus:border-black" /></label>
        <label className="block text-sm font-bold">Phone<input value={form.phone} onChange={(e) => update("phone", e.target.value)} inputMode="tel" autoComplete="tel" placeholder="+91 98765 43210" className="mt-2 h-12 w-full rounded-2xl border border-black/15 bg-[#f8f8f6] px-4 outline-none focus:border-black" /></label>
        <div className="sm:col-span-2"><PasswordField value={form.password} onChange={(value) => update("password", value)} autoComplete="new-password" label="Create password" /></div>
        <label className="flex items-start gap-3 text-xs leading-5 text-black/55 sm:col-span-2"><input type="checkbox" required className="mt-1" />I agree to Prakriti Ganesh terms and privacy policy and want essential order notifications.</label>
        {error ? <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 sm:col-span-2">{error}</p> : null}
        <button disabled={busy || backend !== "ready"} className="h-12 rounded-full bg-[#1f3a2e] px-5 text-sm font-black text-white sm:col-span-2 disabled:cursor-not-allowed disabled:opacity-40">{busy ? "Creating account…" : "Create secure account"}</button>
      </form>
    </AuthShell>
  );
}
