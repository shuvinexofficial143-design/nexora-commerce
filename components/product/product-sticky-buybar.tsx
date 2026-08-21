"use client";
import { useState } from "react";
export function ProductStickyBuybar({ name, price, unavailable }: { name: string; price: number; unavailable: boolean }) {
  const [added, setAdded] = useState(false);
  const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
  return <div className="fixed inset-x-0 bottom-0 z-40 border-t border-black/10 bg-white/92 p-3 shadow-[0_-16px_40px_rgba(0,0,0,.08)] backdrop-blur lg:hidden"><div className="mx-auto flex max-w-7xl items-center gap-3"><div className="min-w-0 flex-1"><p className="truncate text-xs font-black">{name}</p><p className="text-sm font-black">{currency.format(price)}</p></div><button type="button" disabled={unavailable} onClick={() => setAdded(true)} className="rounded-full bg-[#D7FF47] px-5 py-3 text-xs font-black text-black disabled:bg-black/20">{unavailable ? "Notify me" : added ? "Added âœ“" : "Add to bag"}</button></div></div>;
}

