"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthShell } from "@/components/auth/auth-shell";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  return (
    <AuthShell eyebrow="Account recovery" title="Forgot your password?" description="Enter the email connected to your Nexora account. We will prepare a secure recovery flow." footer={<Link href="/login" className="font-black text-black">← Back to sign in</Link>}>
      {sent ? <div className="rounded-3xl border border-black/10 bg-[#f5ffe0] p-6"><p className="text-lg font-black">Recovery link prepared</p><p className="mt-2 text-sm leading-6 text-black/55">Demo mode: continue to the reset screen to preview the full flow.</p><Link href="/reset-password" className="mt-5 inline-flex rounded-full bg-black px-5 py-3 text-sm font-black text-white">Continue to reset →</Link></div> : <form onSubmit={(e) => { e.preventDefault(); if (email.includes("@")) setSent(true); }} className="space-y-4"><label className="block text-sm font-bold">Email address<input required value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="mt-2 h-12 w-full rounded-2xl border border-black/15 bg-[#f8f8f6] px-4 outline-none focus:border-black" /></label><button className="h-12 w-full rounded-full bg-black text-sm font-black text-white">Send recovery link</button></form>}
    </AuthShell>
  );
}
