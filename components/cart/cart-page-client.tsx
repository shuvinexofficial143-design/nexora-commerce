"use client";
import { useEffect, useMemo, useState } from "react";
import { Container } from "@/components/ui/container";
import { CartLineItem } from "@/components/cart/cart-line-item";
import { CartSummary } from "@/components/cart/cart-summary";
import { EmptyCart } from "@/components/cart/empty-cart";
import { SaveForLaterList } from "@/components/cart/save-for-later-list";
import { useCart } from "@/components/cart/cart-provider";
import { checkoutPreviewRequest, fetchCheckoutPreview } from "@/lib/api/checkout-preview-client";
import type { CheckoutPreview } from "@/lib/commerce/checkout-preview";

export function CartPageClient() {
  const { lines, totals, hydrated, coupon, applyVerifiedPrices } = useCart();
  const [checked, setChecked] = useState<{ key: string; quote: CheckoutPreview } | null>(null);
  const [failure, setFailure] = useState<{ key: string; message: string } | null>(null);
  const key = useMemo(() => JSON.stringify({
    lines: lines.map(x => [x.slug, x.choices, x.quantity, x.price, x.lineId]), coupon,
  }), [lines, coupon]);
  const quote = checked?.key === key ? checked.quote : null;
  const error = failure?.key === key ? failure.message : "";
  useEffect(() => {
    if (!hydrated || !lines.length) return;
    let active = true;
    const timer = setTimeout(() => {
      void fetchCheckoutPreview(checkoutPreviewRequest(lines, coupon, "standard"))
        .then(next => { if (active) { setChecked({ key, quote: next }); setFailure(null); } })
        .catch(reason => {
          if (active) setFailure({ key, message: reason instanceof Error ? reason.message : "Live stock check unavailable." });
        });
    }, 250);
    return () => { active = false; clearTimeout(timer); };
  }, [hydrated, lines, coupon, key]);
  return (
    <Container className="min-w-0 overflow-hidden py-5 sm:py-12">
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[.18em] text-black/40 sm:text-xs">NEXORA CART</p>
          <h1 className="mt-1 text-3xl font-black tracking-[-.055em] sm:mt-2 sm:text-5xl">Your cart</h1>
        </div>
        <p className="shrink-0 pb-1 text-xs font-black text-black/45 sm:text-sm">
          {hydrated ? `${totals.itemCount} item${totals.itemCount === 1 ? "" : "s"}` : "Loading cart..."}
        </p>
      </div>
      {!hydrated ? (
        <div className="mt-5 h-72 animate-pulse rounded-[24px] bg-black/5 sm:mt-8 sm:rounded-[30px]" />
      ) : !lines.length ? (
        <div className="mt-5 sm:mt-8"><EmptyCart /><SaveForLaterList /></div>
      ) : (
        <div className="mt-5 grid min-w-0 gap-5 sm:mt-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-8">
          <div className="min-w-0">
            <div className="min-w-0 overflow-hidden rounded-[24px] border border-black/10 bg-white px-3 sm:rounded-[28px] sm:px-6">
              {lines.map(line => <CartLineItem key={line.lineId} line={line} />)}
            </div>
            <section role="status" aria-label="Live cart verification"
              className="mt-4 rounded-2xl border border-black/10 bg-white p-4">
              <h2 className="text-sm font-black">Live SKU price & stock check</h2>
              {!quote && !error ? <p className="mt-1 text-xs text-black/55">Checking current product prices and available quantities…</p> : null}
              {error ? <p className="mt-2 text-xs font-semibold text-red-700">{error} Your cart cannot be verified yet.</p> : null}
              {quote?.issues.map(issue => <p key={issue} className="mt-2 text-xs font-semibold text-red-700">{issue}</p>)}
              {quote?.changedPrice ? <div className="mt-2 space-y-2">
                <p className="text-xs font-semibold text-amber-800">A cart price changed. Review the new amount before checkout.</p>
                {quote.lines.filter(line => line.changedPrice && line.unitPriceMinor !== null).map((line, i) =>
                  <p key={line.slug + i} className="text-xs text-black/70">
                    {line.name} — current price ₹{(line.unitPriceMinor! / 100).toLocaleString("en-IN")} each
                  </p>)}
                {quote.valid ? <button type="button" onClick={() => applyVerifiedPrices(quote.lines)}
                  className="rounded-full bg-[#D7FF47] px-4 py-2 text-xs font-black">Accept updated prices</button> : null}
              </div> : null}
              {quote?.valid && !quote.changedPrice ? <p className="mt-1 text-xs font-bold text-emerald-700">
                Current prices and stock verified. Final stock is checked again at checkout.
              </p> : null}
              <p className="mt-2 text-[11px] text-black/45">Verification does not reserve stock or charge payment.</p>
            </section>
            <SaveForLaterList />
          </div>
          <div className="min-w-0">
            <CartSummary verifiedQuote={quote} verificationError={error} />
          </div>
        </div>
      )}
    </Container>
  );
}
