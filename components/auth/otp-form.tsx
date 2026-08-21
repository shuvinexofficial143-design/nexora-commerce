"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";

export function OtpForm() {
  const params = useSearchParams();
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const next = params.get("next") || "/account";
  function verify(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); if (!/^\d{6}$/.test(otp)) return setError("Enter the 6-digit verification code."); window.location.assign(next.startsWith("/") ? next : "/account"); }
  return (
    <AuthShell eyebrow="Identity check" title="Enter your 6-digit code" description="We use one-time verification for sensitive account actions and new-device sign-ins.">
      <form onSubmit={verify} className="space-y-5"><label className="block text-sm font-bold">Verification code<input value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" placeholder="000000" className="mt-3 h-16 w-full rounded-2xl border border-black/15 bg-[#f8f8f6] px-5 text-center text-3xl font-black tracking-[.35em] outline-none focus:border-black" /></label><p className="text-xs leading-5 text-black/45">Demo: any 6 digits will verify. Real SMS/email OTP provider comes with backend integration.</p>{error ? <p className="text-sm font-bold text-red-700">{error}</p> : null}<button className="h-12 w-full rounded-full bg-black text-sm font-black text-white">Verify & continue</button><button type="button" className="w-full text-sm font-black">Resend code</button></form>
    </AuthShell>
  );
}
