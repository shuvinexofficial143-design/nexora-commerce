import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { publicCustomerAuthEnabled } from "@/lib/config/features";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default function Page() {
  if (!publicCustomerAuthEnabled()) {
    redirect("/shop");
  }

  return <Suspense fallback={<div className="mx-auto max-w-xl px-4 py-24 text-center font-bold">Loading secure sign in…</div>}><LoginForm /></Suspense>;
}
