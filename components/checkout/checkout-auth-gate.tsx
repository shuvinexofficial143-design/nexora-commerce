"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth/auth-provider";

export function CheckoutAuthGate({ children }: { children: React.ReactNode }) {
  const { ready, session, backend, backendMessage } = useAuth();

  if (!ready || backend === "checking") {
    return (
      <section className="mx-auto max-w-2xl px-4 py-24 text-center">
        <div className="mx-auto h-14 w-14 animate-pulse rounded-full bg-black/10" />
        <h1 className="mt-5 text-3xl font-black">Preparing secure checkoutâ€¦</h1>
      </section>
    );
  }

  if (backend === "unavailable") {
    return (
      <section className="mx-auto max-w-2xl px-4 py-24 text-center">
        <div className="text-5xl">ðŸ—„ï¸</div>
        <h1 className="mt-5 text-3xl font-black">Database setup is required.</h1>
        <p className="mx-auto mt-3 max-w-lg text-sm font-bold leading-6 text-black/50">{backendMessage}</p>
      </section>
    );
  }

  if (!session) {
    return (
      <section className="mx-auto max-w-2xl px-4 py-24 text-center">
        <div className="text-5xl">ðŸ”</div>
        <h1 className="mt-5 text-3xl font-black">Sign in before checkout.</h1>
        <p className="mx-auto mt-3 max-w-lg text-sm font-bold leading-6 text-black/50">
          Real orders are linked to your secure NEXORA account, so you can track them later.
        </p>
        <Link
          href="/login?next=/checkout"
          className="mt-7 inline-flex rounded-full border border-black/10 bg-[#CDEBFF] px-6 py-3.5 text-sm font-black text-black transition hover:bg-[#B8E1FA]"
        >
          Sign in securely â†’
        </Link>
      </section>
    );
  }

  return <>{children}</>;
}


