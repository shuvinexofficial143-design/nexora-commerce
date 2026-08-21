import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-xl px-4 py-24 text-center font-bold">Loading secure sign in…</div>}>
      <LoginForm />
    </Suspense>
  );
}
