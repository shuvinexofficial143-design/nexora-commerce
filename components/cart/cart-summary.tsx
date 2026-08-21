"use client";

import Link from "next/link";
import { CouponBox } from "@/components/cart/coupon-box";
import { ShippingProgress } from "@/components/cart/shipping-progress";
import { useCart } from "@/components/cart/cart-provider";
import { currency } from "@/lib/cart-utils";

export function CartSummary() {
  const { totals } = useCart();
  return (
    <aside className="rounded-[28px] border border-black/10 bg-white p-5 shadow-[0_20px_70px_rgba(17,17,15,.06)] lg:sticky lg:top-32">
      <h2 className="text-xl font-black tracking-[-.03em]">Order summary</h2>
      <div className="mt-5"><ShippingProgress subtotal={totals.subtotal} /></div>
      <div className="mt-5"><CouponBox /></div>
      <dl className="mt-6 space-y-3 text-sm"><div className="flex justify-between"><dt className="font-bold text-black/55">Subtotal</dt><dd className="font-black">{currency.format(totals.subtotal)}</dd></div>{totals.discount > 0 && <div className="flex justify-between text-emerald-700"><dt className="font-bold">Coupon saving</dt><dd className="font-black">âˆ’{currency.format(totals.discount)}</dd></div>}<div className="flex justify-between"><dt className="font-bold text-black/55">Delivery</dt><dd className="font-black">{totals.shipping ? currency.format(totals.shipping) : "FREE"}</dd></div><div className="flex justify-between"><dt className="font-bold text-black/55">Estimated tax</dt><dd className="font-black">{currency.format(totals.tax)}</dd></div></dl>
      <div className="my-5 border-t border-black/10" />
      <div className="flex items-end justify-between"><div><p className="text-xs font-bold text-black/45">Estimated total</p><p className="text-[11px] font-bold text-black/35">Tax included above</p></div><p className="text-2xl font-black tracking-[-.04em]">{currency.format(totals.total)}</p></div>
      <Link href="/checkout" className="mt-5 block rounded-full border border-black/10 bg-[#D7FF47] px-5 py-4 text-center text-sm font-black text-black transition hover:bg-[#C7ED37]">Secure checkout â†’</Link>
      <p className="mt-3 text-center text-[11px] font-bold text-black/40">UPI Â· Cards Â· COD Â· EMI ready</p>
    </aside>
  );
}

