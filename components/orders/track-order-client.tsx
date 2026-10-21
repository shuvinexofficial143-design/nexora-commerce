"use client";

import { useState } from "react";
import Link from "next/link";
import { Container } from "@/components/ui/container";

type TrackingResult = {
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string | null;
  subtotalMinor: number;
  discountMinor: number;
  shippingMinor: number;
  taxMinor: number;
  totalMinor: number;
  createdAt: string;
  updatedAt: string;
  shippingAddress: {
    fullName?: string; line1?: string; line2?: string; city?: string;
    state?: string; postalCode?: string; country?: string;
  };
  items: Array<{ productName: string; quantity: number; totalMinor: number }>;
  guidance: { cancellation: string; returns: string };
  timeline: Array<{ title: string; at: string }>;
};
type Envelope<T> = { ok: true; data: T } | { ok: false; error: string };
type Phase = "identify" | "verify" | "details";
const money = (minor: number) => new Intl.NumberFormat("en-IN", {
  style: "currency", currency: "INR", maximumFractionDigits: 0,
}).format(minor / 100);
const date = (iso: string) => new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
const pretty = (value: string) => value.replaceAll("_", " ");

async function jsonResponse<T>(response: Response): Promise<T> {
  const payload = await response.json() as Envelope<T>;
  if (!response.ok || !payload.ok) {
    throw new Error(payload.ok ? "Request failed." : payload.error);
  }
  return payload.data;
}

export function TrackOrderClient() {
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [result, setResult] = useState<TrackingResult | null>(null);
  const [phase, setPhase] = useState<Phase>("identify");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function requestCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError(""); setResult(null);
    try {
      const response = await fetch("/api/backend/orders/track/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ orderNumber, email }),
      });
      const data = await jsonResponse<{ challengeId: string; message: string }>(response);
      setChallengeId(data.challengeId);
      setCode("");
      setPhase("verify");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not request a code.");
    } finally { setBusy(false); }
  }

  async function verifyCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError("");
    try {
      const verified = await jsonResponse<{ accessToken: string; expiresInSeconds: number }>(
        await fetch("/api/backend/orders/track/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
          body: JSON.stringify({ challengeId, code }),
        }),
      );
      // Token stays only in component memory, never in URL/localStorage.
      const tracked = await jsonResponse<TrackingResult>(await fetch("/api/backend/orders/track", {
        cache: "no-store",
        headers: { Authorization: `Bearer ${verified.accessToken}` },
      }));
      setResult(tracked);
      setCode("");
      setPhase("details");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Verification failed.");
    } finally { setBusy(false); }
  }

  const address = result?.shippingAddress;
  const addressLines = address
    ? [address.fullName, address.line1, address.line2, [address.city, address.state, address.postalCode].filter(Boolean).join(", "), address.country].filter(Boolean)
    : [];

  return (
    <main className="pb-24 pt-10 sm:pt-14">
      <Container>
        <div className="mx-auto max-w-4xl">
          <p className="text-xs font-black uppercase tracking-[.18em] text-black/35">Secure guest order lookup</p>
          <h1 className="mt-2 text-4xl font-black tracking-[-.06em] sm:text-6xl">Track your order</h1>
          <p className="mt-4 max-w-2xl text-sm font-bold leading-6 text-black/55">
            No account needed. We send a one-time code to your checkout email before showing private order details.
          </p>

          {phase === "identify" ? (
            <form onSubmit={requestCode} className="mt-8 grid gap-4 rounded-[28px] border border-black/10 bg-white p-5 sm:grid-cols-2 sm:p-7">
              <label className="text-xs font-black uppercase tracking-wide text-black/55">
                Order number
                <input required autoComplete="off" maxLength={30} value={orderNumber}
                  onChange={(event) => setOrderNumber(event.target.value)}
                  placeholder="NX-20261021-XXXXXXXX"
                  className="mt-2 w-full rounded-2xl border border-black/15 bg-[#f7f7f3] px-4 py-3 text-sm font-bold normal-case outline-none focus:border-black" />
              </label>
              <label className="text-xs font-black uppercase tracking-wide text-black/55">
                Checkout email
                <input required type="email" autoComplete="email" maxLength={254} value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  className="mt-2 w-full rounded-2xl border border-black/15 bg-[#f7f7f3] px-4 py-3 text-sm font-bold normal-case outline-none focus:border-black" />
              </label>
              <button disabled={busy} type="submit" className="rounded-full bg-black px-6 py-3.5 text-sm font-black text-white disabled:opacity-50 sm:col-span-2">
                {busy ? "Sending code…" : "Send verification code"}
              </button>
            </form>
          ) : null}

          {phase === "verify" ? (
            <form onSubmit={verifyCode} className="mt-8 rounded-[28px] border border-black/10 bg-white p-5 sm:p-7">
              <h2 className="text-xl font-black">Check your email</h2>
              <p className="mt-2 text-sm leading-6 text-black/55">
                If these details match an order, we have sent a code to {email}. It expires in 10 minutes.
              </p>
              <label className="mt-5 block text-xs font-black uppercase tracking-wide text-black/55">
                Six-digit code
                <input required inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6}
                  value={code} onChange={(event) => setCode(event.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="000000"
                  className="mt-2 w-full max-w-xs rounded-2xl border border-black/15 bg-[#f7f7f3] px-4 py-3 text-2xl font-black tracking-[.3em] outline-none focus:border-black" />
              </label>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <button disabled={busy} className="rounded-full bg-black px-6 py-3 text-sm font-black text-white disabled:opacity-50">
                  {busy ? "Verifying…" : "View order securely"}
                </button>
                <button type="button" onClick={() => { setPhase("identify"); setChallengeId(""); setCode(""); setError(""); }}
                  className="rounded-full border border-black/15 px-6 py-3 text-sm font-black">Start again</button>
              </div>
            </form>
          ) : null}

          {error ? <div role="alert" className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-800">{error}</div> : null}

          {phase === "details" && result ? (
            <section aria-label="Verified order details" className="mt-8 space-y-5">
              <div className="rounded-[28px] border border-black/10 bg-white p-5 sm:p-7">
                <div className="flex flex-wrap justify-between gap-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-black/40">Verified order</p>
                    <h2 className="mt-2 break-words text-2xl font-black">{result.orderNumber}</h2>
                    <p className="mt-1 text-xs font-bold text-black/50">Placed {date(result.createdAt)}</p>
                  </div>
                  <div className="sm:text-right">
                    <span className="inline-block rounded-full bg-[#d7ff47] px-3 py-1.5 text-xs font-black">{pretty(result.status)}</span>
                    <p className="mt-3 text-2xl font-black">{money(result.totalMinor)}</p>
                  </div>
                </div>
                <div className="mt-6 border-t border-black/10 pt-5">
                  <h3 className="text-lg font-black">Order timeline</h3>
                  <ol className="mt-4 space-y-4 border-l-2 border-black/10 pl-5">
                    {result.timeline.map((event, index) => (
                      <li key={index}>
                        <p className="text-sm font-black">{pretty(event.title)}</p>
                        <p className="text-xs text-black/50">{date(event.at)}</p>
                      </li>
                    ))}
                  </ol>
                  <p className="mt-4 text-xs text-black/50">
                    These are recorded order updates. Courier tracking events and delivery estimates are shown only when actually available.
                  </p>
                </div>
              </div>

              <div className="rounded-[28px] border border-black/10 bg-white p-5 sm:p-7">
                <h3 className="text-lg font-black">Purchased items</h3>
                <div className="mt-4 divide-y divide-black/10">
                  {result.items.map((item, index) => (
                    <div key={index} className="flex flex-wrap items-center justify-between gap-3 py-4">
                      <div><p className="text-sm font-black">{item.productName}</p><p className="text-xs text-black/50">Quantity: {item.quantity}</p></div>
                      <p className="text-sm font-black">{money(item.totalMinor)}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-5 grid gap-2 border-t border-black/10 pt-4 text-sm">
                  <div className="flex justify-between"><span>Subtotal</span><strong>{money(result.subtotalMinor)}</strong></div>
                  <div className="flex justify-between"><span>Discount</span><strong>-{money(result.discountMinor)}</strong></div>
                  <div className="flex justify-between"><span>Shipping</span><strong>{money(result.shippingMinor)}</strong></div>
                  <div className="flex justify-between"><span>Tax</span><strong>{money(result.taxMinor)}</strong></div>
                  <div className="flex justify-between border-t border-black/10 pt-3 text-base font-black"><span>Order total</span><span>{money(result.totalMinor)}</span></div>
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="rounded-[28px] border border-black/10 bg-white p-5 sm:p-6">
                  <h3 className="text-lg font-black">Delivery address</h3>
                  <address className="mt-3 whitespace-pre-line text-sm not-italic leading-6 text-black/65">
                    {addressLines.join("\n") || "No address on file."}
                  </address>
                </div>
                <div className="rounded-[28px] border border-black/10 bg-white p-5 sm:p-6">
                  <h3 className="text-lg font-black">Payment</h3>
                  <p className="mt-3 text-sm font-bold">{(result.paymentMethod ?? "Not recorded").toUpperCase()}</p>
                  <p className="mt-1 text-sm text-black/60">Status: {pretty(result.paymentStatus)}</p>
                  <p className="mt-3 text-xs text-black/50">Last order update: {date(result.updatedAt)}</p>
                </div>
              </div>
              <div className="rounded-[28px] border border-black/10 bg-white p-5 sm:p-6">
                <h3 className="text-lg font-black">Cancellation and returns</h3>
                <p className="mt-3 text-sm leading-6 text-black/65">{result.guidance.cancellation}</p>
                <p className="mt-2 text-sm leading-6 text-black/65">{result.guidance.returns}</p>
                <Link href="/returns-policy" className="mt-4 inline-block text-sm font-black underline underline-offset-4">Read return policy</Link>
              </div>
              <button type="button" onClick={() => { setResult(null); setPhase("identify"); setError(""); }}
                className="rounded-full border border-black/20 px-6 py-3 text-sm font-black">Track another order</button>
            </section>
          ) : null}
        </div>
      </Container>
    </main>
  );
}
