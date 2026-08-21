"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { PasswordField } from "@/components/auth/password-field";

export function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  function submit(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); if (password.length < 8 || password !== confirm) return setError("Passwords must match and contain at least 8 characters."); setError(""); setDone(true); }
  return (
    <AuthShell eyebrow="Secure reset" title="Choose a new password" description="Use a strong password you have not used on another website." footer={<Link href="/login" className="font-black text-black">Return to sign in →</Link>}>
      {done ? <div className="rounded-3xl bg-[#f5ffe0] p-6"><p className="text-xl font-black">Password updated</p><p className="mt-2 text-sm text-black/55">The production version will invalidate other sessions after a reset.</p><Link href="/login" className="mt-5 inline-flex rounded-full bg-black px-5 py-3 text-sm font-black text-white">Sign in</Link></div> : <form onSubmit={submit} className="space-y-4"><PasswordField value={password} onChange={setPassword} autoComplete="new-password" label="New password" /><PasswordField value={confirm} onChange={setConfirm} autoComplete="new-password" label="Confirm password" />{error ? <p className="text-sm font-bold text-red-700">{error}</p> : null}<button className="h-12 w-full rounded-full bg-black text-sm font-black text-white">Update password</button></form>}
    </AuthShell>
  );
}
