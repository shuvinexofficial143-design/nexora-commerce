"use client";

import { useAuth } from "@/components/auth/auth-provider";

export function CheckoutAuthGate({ children }: { children: React.ReactNode }) {
  const { ready, backend, backendMessage } = useAuth();

  if (!ready || backend === "checking") {
    return (
      <section className="mx-auto max-w-2xl px-4 py-24 text-center">
        <div className="mx-auto h-14 w-14 animate-pulse rounded-full bg-black/10" />
        <h1 className="mt-5 text-3xl font-black">Preparing Prakriti Ganesh checkout…</h1>
      </section>
    );
  }

  if (backend === "unavailable") {
    return (
      <section className="mx-auto max-w-2xl px-4 py-24 text-center">
        <div className="text-5xl">🙏</div>
        <h1 className="mt-5 text-3xl font-black">Checkout database setup is required.</h1>
        <p className="mx-auto mt-3 max-w-lg text-sm font-bold leading-6 text-black/50">{backendMessage}</p>
        <p className="mx-auto mt-3 max-w-lg text-xs font-semibold leading-5 text-black/40">Use a separate Prakriti Ganesh database. The original NEXORA database must not be reused.</p>
      </section>
    );
  }

  return <>{children}</>;
}
