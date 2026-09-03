"use client";

import { useState } from "react";
import { useCart } from "@/components/cart/cart-provider";

export function CouponBox() {
  const { coupon, applyCoupon, clearCoupon } = useCart();
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [ok, setOk] = useState(false);

  if (coupon) {
    return (
      <div className="flex min-w-0 items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 sm:p-4">
        <div className="min-w-0"><p className="text-xs font-black text-emerald-800">Festival coupon applied</p><p className="truncate text-sm font-black">{coupon}</p></div>
        <button type="button" onClick={clearCoupon} className="shrink-0 text-xs font-black underline">Remove</button>
      </div>
    );
  }

  return (
    <div className="min-w-0">
      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-2">
        <input value={code} onChange={(event) => setCode(event.target.value)} placeholder="Festival coupon" className="min-w-0 w-full rounded-full border border-black/10 bg-white px-4 py-3 text-base font-bold outline-none focus:border-black/40 sm:text-sm" />
        <button type="button" onClick={() => { const result = applyCoupon(code); setOk(result.ok); setMessage(result.message); }} className="shrink-0 rounded-full border border-black/10 bg-[#f4ead7] px-4 py-3 text-xs font-black text-[#1f3a2e] hover:bg-[#eadcc4]">Apply</button>
      </div>
      {message ? <p className={`mt-2 text-xs font-bold ${ok ? "text-emerald-700" : "text-red-700"}`}>{message}</p> : <p className="mt-2 text-[11px] font-bold text-black/40">Try GANESH10 · ECO500 on eligible orders</p>}
    </div>
  );
}
