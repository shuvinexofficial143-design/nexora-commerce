import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { OtpForm } from "@/components/auth/otp-form";
import { customerAuthEnabled } from "@/lib/auth/features";

export const metadata: Metadata = { title: "Verify OTP" };

export default function VerifyOtpPage() {
  if (!customerAuthEnabled()) notFound();

  return (
    <Suspense fallback={<div className="mx-auto max-w-xl px-4 py-24 text-center text-sm font-bold text-black/45">Preparing verification…</div>}>
      <OtpForm />
    </Suspense>
  );
}
