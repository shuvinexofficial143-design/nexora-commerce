"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "@/components/cart/cart-provider";
import { verifyCashfreePayment } from "@/lib/api/payments-client";

type State = "checking" | "pending" | "failed";

export function CashfreeReturn({ orderNumber }: { orderNumber: string }) {
  const router = useRouter();
  const { clearCart } = useCart();
  const [state, setState] = useState<State>("checking");
  const [error, setError] = useState("");

  async function verify() {
    if (!orderNumber) {
      setError("Payment return is missing the order number.");
      setState("failed");
      return;
    }

    setState("checking");
    setError("");

    try {
      const result = await verifyCashfreePayment(orderNumber);

      if (result.state === "SUCCESS") {
        clearCart();
        router.replace(`/checkout/success?order=${encodeURIComponent(orderNumber)}`);
        return;
      }

      setState(result.state === "PENDING" ? "pending" : "failed");
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not verify payment.",
      );
      setState("failed");
    }
  }

  useEffect(() => {
    void verify();
    // orderNumber is fixed for this return page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderNumber]);

  return (
    <main className="mx-auto max-w-2xl px-4 py-20 text-center">
      <div
        className={`mx-auto grid h-20 w-20 place-items-center rounded-full text-3xl ${
          state === "failed" ? "bg-red-100" : "bg-[#d7ff47]"
        }`}
      >
        {state === "checking" ? "…" : state === "pending" ? "⌛" : "!"}
      </div>

      <p className="mt-6 text-xs font-black uppercase tracking-[.18em] text-black/35">
        Cashfree payment
      </p>
      <h1 className="mt-2 text-4xl font-black tracking-[-.05em]">
        {state === "checking"
          ? "Verifying payment…"
          : state === "pending"
            ? "Payment is processing"
            : "Payment not confirmed"}
      </h1>

      <p className="mx-auto mt-4 max-w-lg text-sm font-bold leading-6 text-black/45">
        {error ||
          (state === "pending"
            ? "Cashfree has not reported a successful payment yet. Do not place a second order; check again in a moment."
            : state === "failed"
              ? "No successful Cashfree payment was verified for this order. Your cart is still available."
              : "Nexora is checking Cashfree directly before confirming the order.")}
      </p>

      <p className="mt-3 text-xs font-black text-black/35">{orderNumber}</p>

      {state !== "checking" ? (
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => void verify()}
            className="rounded-full bg-black px-6 py-3 text-sm font-black text-white"
          >
            Check again
          </button>
          {state === "failed" ? (
            <Link
              href="/checkout"
              className="rounded-full border border-black/10 bg-white px-6 py-3 text-sm font-black"
            >
              Return to checkout
            </Link>
          ) : null}
        </div>
      ) : null}
    </main>
  );
}
