"use client";

import { useCart } from "@/components/cart/cart-provider";
import { PromoSummary } from "@/components/checkout/promo-summary";
import { SecureCheckoutNote } from "@/components/checkout/secure-checkout-note";
import { currency } from "@/lib/cart-utils";
import type { CheckoutPreview } from "@/lib/commerce/checkout-preview";
import type { DeliveryOption, PaymentMethodId } from "@/types/checkout";

export function CheckoutSummary({
  delivery, paymentId, placing, onPlaceOrder, onReview, quote,
}: {
  delivery: DeliveryOption;
  paymentId: PaymentMethodId;
  placing: boolean;
  onPlaceOrder: () => void;
  onReview: () => void;
  quote: CheckoutPreview | null;
}) {
  const { coupon } = useCart();
  const format = (minor: number) => currency.format(minor / 100);
  return (
    <aside className="rounded-[30px] border border-black/10 bg-white p-5 shadow-[0_20px_70px_rgba(17,17,15,.06)] lg:sticky lg:top-28">
      <p className="text-xs font-black uppercase tracking-[.16em] text-black/35">Server-verified checkout</p>
      <div className="mt-2 flex items-end justify-between gap-4">
        <h2 className="text-xl font-black">Order total</h2>
        <p className="text-3xl font-black tracking-[-.05em]">{quote ? format(quote.totalMinor) : "Verifying…"}</p>
      </div>
      <dl className="mt-6 space-y-3 text-sm">
        <Row label="Items" value={quote ? format(quote.subtotalMinor) : "—"} />
        <Row label="Discount" value={quote && quote.discountMinor ? "−" + format(quote.discountMinor) : "—"} good={Boolean(quote?.discountMinor)} />
        <Row label={delivery.label} value={quote ? quote.shippingMinor ? format(quote.shippingMinor) : "FREE" : "—"} />
        <Row label="Tax" value={quote ? format(quote.taxMinor) : "—"} />
      </dl>
      <div className="my-5 border-t border-black/10" />
      {quote?.valid && !quote.changedPrice && coupon ? <PromoSummary coupon={coupon} /> : null}
      <p className="mt-3 text-xs leading-5 text-black/50">
        {quote?.valid && !quote.changedPrice
          ? "Prices and stock were checked against the store database. Final availability is confirmed when the order is created."
          : "Order cannot be placed until the store verifies current prices, stock and any coupon."}
      </p>
      <button type="button" onClick={() => { onReview(); onPlaceOrder(); }} disabled={placing}
        className="mt-5 w-full rounded-full bg-[#D7FF47] px-5 py-4 text-sm font-black text-black transition hover:bg-[#D7FF47]/80 disabled:cursor-wait disabled:opacity-55">
        {placing ? paymentId === "cashfree" ? "Opening Cashfree…" : "Verifying and placing…" :
          (paymentId === "cashfree" ? "Continue to Cashfree" : "Place COD order") +
            (quote?.valid && !quote.changedPrice ? " · " + format(quote.totalMinor) : " · Verify first")}
      </button>
      <SecureCheckoutNote />
    </aside>
  );
}
function Row({ label, value, good = false }: { label: string; value: string; good?: boolean }) {
  return <div className="flex justify-between gap-4"><dt className="font-bold text-black/45">{label}</dt>
    <dd className={`font-black ${good ? "text-emerald-700" : ""}`}>{value}</dd></div>;
}
