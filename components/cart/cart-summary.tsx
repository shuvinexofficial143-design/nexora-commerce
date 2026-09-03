"use client";

import Link from "next/link";
import { CouponBox } from "@/components/cart/coupon-box";
import { ShippingProgress } from "@/components/cart/shipping-progress";
import { useCart } from "@/components/cart/cart-provider";
import { currency } from "@/lib/cart-utils";

export function CartSummary() {
  const { totals } = useCart();

  return (
    <aside className="min-w-0 overflow-hidden rounded-[24px] border border-black/10 bg-[#fffdf8] p-4 shadow-[0_20px_70px_rgba(17,17,15,.06)] sm:rounded-[28px] sm:p-5 lg:sticky lg:top-32">
      <p className="text-[10px] font-black uppercase tracking-[.18em] text-[#a54f2a]">Festival order</p>
      <h2 className="mt-1 text-lg font-black tracking-[-.03em] sm:text-xl">Order summary</h2>

      <div className="mt-4 sm:mt-5"><ShippingProgress subtotal={totals.subtotal} /></div>
      <div className="mt-4 sm:mt-5"><CouponBox /></div>

      <dl className="mt-5 space-y-3 text-sm sm:mt-6">
        <div className="flex min-w-0 items-center justify-between gap-4"><dt className="font-bold text-black/55">Murti subtotal</dt><dd className="shrink-0 font-black">{currency.format(totals.subtotal)}</dd></div>
        {totals.discount > 0 ? <div className="flex min-w-0 items-center justify-between gap-4 text-emerald-700"><dt className="font-bold">Festival saving</dt><dd className="shrink-0 font-black">−{currency.format(totals.discount)}</dd></div> : null}
        <div className="flex min-w-0 items-center justify-between gap-4"><dt className="font-bold text-black/55">Protected delivery</dt><dd className="shrink-0 font-black">{totals.shipping ? currency.format(totals.shipping) : "FREE"}</dd></div>
        <div className="flex min-w-0 items-center justify-between gap-4"><dt className="font-bold text-black/55">Estimated tax</dt><dd className="shrink-0 font-black">{currency.format(totals.tax)}</dd></div>
      </dl>

      <div className="my-5 border-t border-black/10" />
      <div className="flex min-w-0 items-end justify-between gap-4">
        <div className="min-w-0"><p className="text-xs font-bold text-black/45">Estimated total</p><p className="text-[11px] font-bold text-black/35">Careful packing included</p></div>
        <p className="shrink-0 text-xl font-black tracking-[-.04em] sm:text-2xl">{currency.format(totals.total)}</p>
      </div>

      <Link href="/checkout" className="mt-5 block w-full rounded-full border border-black/10 bg-[#1f3a2e] px-4 py-3.5 text-center text-sm font-black text-white transition hover:bg-[#294b3c] sm:px-5 sm:py-4">Continue to secure checkout →</Link>
      <p className="mt-3 text-center text-[10px] font-bold text-black/40 sm:text-[11px]">UPI · Cards · COD · Secure payment</p>
    </aside>
  );
}
