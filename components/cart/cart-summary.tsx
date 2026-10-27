"use client";

import Link from "next/link";
import { CouponBox } from "@/components/cart/coupon-box";
import { ShippingProgress } from "@/components/cart/shipping-progress";
import { useCart } from "@/components/cart/cart-provider";
import { currency } from "@/lib/cart-utils";
import type { CheckoutPreview } from "@/lib/commerce/checkout-preview";

export function CartSummary({ verifiedQuote, verificationError = "" }: {
  verifiedQuote?: CheckoutPreview | null; verificationError?: string;
}) {
  const { totals } = useCart();
  const verified = Boolean(verifiedQuote?.valid && !verifiedQuote?.changedPrice && !verificationError);
  const money = (minor: number) => currency.format(minor / 100);
  const subtotal = verified && verifiedQuote ? money(verifiedQuote.subtotalMinor) : currency.format(totals.subtotal);
  const discount = verified && verifiedQuote ? money(verifiedQuote.discountMinor) : currency.format(totals.discount);
  const shipping = verified && verifiedQuote ? money(verifiedQuote.shippingMinor) : currency.format(totals.shipping);
  const tax = verified && verifiedQuote ? money(verifiedQuote.taxMinor) : currency.format(totals.tax);
  const total = verified && verifiedQuote ? money(verifiedQuote.totalMinor) : currency.format(totals.total);

  return (
    <aside className="min-w-0 overflow-hidden rounded-[24px] border border-black/10 bg-white p-4 shadow-[0_20px_70px_rgba(17,17,15,.06)] sm:rounded-[28px] sm:p-5 lg:sticky lg:top-32">
      <h2 className="text-lg font-black tracking-[-.03em] sm:text-xl">Order summary</h2>

      <div className="mt-4 sm:mt-5"><ShippingProgress subtotal={totals.subtotal} /></div>
      <div className="mt-4 sm:mt-5"><CouponBox /></div>

      <dl className="mt-5 space-y-3 text-sm sm:mt-6">
        <div className="flex min-w-0 items-center justify-between gap-4">
          <dt className="font-bold text-black/55">Subtotal</dt>
          <dd className="shrink-0 font-black">{subtotal}</dd>
        </div>
        {totals.discount > 0 ? (
          <div className="flex min-w-0 items-center justify-between gap-4 text-emerald-700">
            <dt className="font-bold">Coupon saving</dt>
            <dd className="shrink-0 font-black">−{discount}</dd>
          </div>
        ) : null}
        <div className="flex min-w-0 items-center justify-between gap-4">
          <dt className="font-bold text-black/55">Delivery</dt>
          <dd className="shrink-0 font-black">{(verified && verifiedQuote ? verifiedQuote.shippingMinor : totals.shipping) ? shipping : "FREE"}</dd>
        </div>
        <div className="flex min-w-0 items-center justify-between gap-4">
          <dt className="font-bold text-black/55">Estimated tax</dt>
          <dd className="shrink-0 font-black">{tax}</dd>
        </div>
      </dl>

      <div className="my-5 border-t border-black/10" />

      <div className="flex min-w-0 items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-bold text-black/45">{verified ? "Server-verified total" : "Estimated total"}</p>
          <p className="text-[11px] font-bold text-black/35">{verified ? "Rechecked again when the order is placed" : "Checkout needs current stock verification"}</p>
        </div>
        <p className="shrink-0 text-xl font-black tracking-[-.04em] sm:text-2xl">{total}</p>
      </div>

      {verified ? <Link href="/checkout" className="mt-5 block w-full rounded-full border border-black/10 bg-[#D7FF47] px-4 py-3.5 text-center text-sm font-black text-black transition hover:bg-[#C7ED37] sm:px-5 sm:py-4">
        Secure checkout →
      </Link> : <p className="mt-5 rounded-full bg-black/10 px-4 py-3.5 text-center text-sm font-black text-black/55" aria-live="polite">
        {verificationError ? "Verification unavailable — retry shortly" : verifiedQuote ? "Resolve cart issues before checkout" : "Verifying live stock…"}
      </p>}
      <p className="mt-3 text-center text-[10px] font-bold text-black/40 sm:text-[11px]">COD available · Online payment when enabled</p>
    </aside>
  );
}
