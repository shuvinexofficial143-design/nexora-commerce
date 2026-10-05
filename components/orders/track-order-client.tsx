"use client";

import { useState } from "react";
import { Container } from "@/components/ui/container";

type TrackedOrder = {
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string | null;
  totalMinor: number;
  createdAt: string;
  updatedAt: string;
  items: Array<{ productName: string; quantity: number; totalMinor: number }>;
};

const money = (minor: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(minor / 100);

export function TrackOrderClient() {
  const [order, setOrder] = useState("");
  const [email, setEmail] = useState("");
  const [result, setResult] = useState<TrackedOrder | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch(
        `/api/backend/orders/track?order=${encodeURIComponent(order.trim())}&email=${encodeURIComponent(email.trim())}`,
        { cache: "no-store" },
      );
      const payload = (await response.json()) as {
        ok?: boolean;
        data?: TrackedOrder;
        error?: string;
      };
      if (!response.ok || !payload.ok || !payload.data) {
        throw new Error(payload.error || "Order lookup failed.");
      }
      setResult(payload.data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Order lookup failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="pb-24 pt-10 sm:pt-14">
      <Container>
        <div className="mx-auto max-w-3xl">
          <p className="text-xs font-black uppercase tracking-[.18em] text-black/35">Guest order</p>
          <h1 className="mt-2 text-4xl font-black tracking-[-.06em] sm:text-6xl">Track your order</h1>
          <p className="mt-4 max-w-2xl text-sm font-bold leading-6 text-black/45">
            No account is required. Use the order number and the same email used at checkout.
          </p>

          <form onSubmit={submit} className="mt-8 grid gap-3 rounded-[28px] border border-black/10 bg-white p-5 sm:grid-cols-2 sm:p-6">
            <label className="text-xs font-black uppercase tracking-wide text-black/45">
              Order number
              <input
                required
                value={order}
                onChange={(event) => setOrder(event.target.value)}
                placeholder="NX-20261005-XXXXXXXX"
                className="mt-2 w-full rounded-2xl border border-black/10 bg-[#f7f7f3] px-4 py-3 text-sm font-bold normal-case tracking-normal outline-none focus:border-black"
              />
            </label>
            <label className="text-xs font-black uppercase tracking-wide text-black/45">
              Checkout email
              <input
                required
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="mt-2 w-full rounded-2xl border border-black/10 bg-[#f7f7f3] px-4 py-3 text-sm font-bold normal-case tracking-normal outline-none focus:border-black"
              />
            </label>
            <button
              disabled={busy}
              className="rounded-full bg-black px-5 py-3 text-sm font-black text-white sm:col-span-2 disabled:opacity-50"
            >
              {busy ? "Checking…" : "Track order"}
            </button>
          </form>

          {error ? (
            <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-800">
              {error}
            </div>
          ) : null}

          {result ? (
            <section className="mt-6 rounded-[28px] border border-black/10 bg-white p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-black/35">Order</p>
                  <p className="mt-1 text-xl font-black">{result.orderNumber}</p>
                  <p className="mt-1 text-xs font-bold text-black/40">
                    Placed {new Date(result.createdAt).toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="text-right">
                  <span className="rounded-full bg-[#d7ff47] px-3 py-1.5 text-xs font-black">
                    {result.status.replaceAll("_", " ")}
                  </span>
                  <p className="mt-3 text-xl font-black">{money(result.totalMinor)}</p>
                </div>
              </div>

              <div className="mt-6 divide-y divide-black/8">
                {result.items.map((item, index) => (
                  <div key={`${item.productName}-${index}`} className="flex items-center justify-between gap-4 py-3">
                    <div>
                      <p className="text-sm font-black">{item.productName}</p>
                      <p className="text-xs font-bold text-black/40">Qty {item.quantity}</p>
                    </div>
                    <p className="text-sm font-black">{money(item.totalMinor)}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-[#f5f5f1] p-4">
                  <p className="text-[10px] font-black uppercase tracking-wide text-black/35">Payment</p>
                  <p className="mt-1 text-sm font-black">
                    {(result.paymentMethod || "—").toUpperCase()} · {result.paymentStatus}
                  </p>
                </div>
                <div className="rounded-2xl bg-[#f5f5f1] p-4">
                  <p className="text-[10px] font-black uppercase tracking-wide text-black/35">Last update</p>
                  <p className="mt-1 text-sm font-black">{new Date(result.updatedAt).toLocaleString("en-IN")}</p>
                </div>
              </div>
            </section>
          ) : null}
        </div>
      </Container>
    </main>
  );
}
