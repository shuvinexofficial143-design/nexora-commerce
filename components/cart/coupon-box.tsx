"use client";

import { useState } from "react";
import { useCart } from "@/components/cart/cart-provider";

export function CouponBox() {
  const { coupon, applyCoupon, clearCoupon } = useCart();
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [ok, setOk] = useState(false);

  if (coupon) return <div className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 p-4"><div><p className="text-xs font-black text-emerald-800">Coupon applied</p><p className="text-sm font-black">{coupon}</p></div><button type="button" onClick={clearCoupon} className="text-xs font-black underline">Remove</button></div>;

  return (
    <div><div className="flex gap-2"><input value={code} onChange={(event) => setCode(event.target.value)} placeholder="Coupon code" className="min-w-0 flex-1 rounded-full border border-black/10 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-black/40" /><button type="button" onClick={() => { const result = applyCoupon(code); setOk(result.ok); setMessage(result.message); }} className="rounded-full border border-black/10 bg-[#FFD8C7] px-4 py-3 text-xs font-black text-black hover:bg-[#FFC8B4]">Apply</button></div>{message ? <p className={`mt-2 text-xs font-bold ${ok ? "text-emerald-700" : "text-red-700"}`}>{message}</p> : <p className="mt-2 text-[11px] font-bold text-black/40">Try HELLO10 Â· SAVE500 on eligible carts</p>}</div>
  );
}

