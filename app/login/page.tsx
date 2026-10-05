import { notFound } from "next/navigation";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { customerAuthEnabled } from "@/lib/auth/features";

export default function LoginPage() {
  if (!customerAuthEnabled()) notFound();

  return (
    <Suspense fallback={<div className="mx-auto max-w-xl px-4 py-24 text-center font-bold">Loading secure sign in…</div>}>
      <LoginForm />
    </Suspense>
  );
}
