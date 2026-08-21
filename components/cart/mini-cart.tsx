"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/components/cart/cart-provider";
import { currency } from "@/lib/cart-utils";

export function MiniCart({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { lines, totals } = useCart();
  const latest = lines.at(-1);
  if (!open || !latest) return null;
  return (
    <div className="fixed inset-0 z-[80] pointer-events-none"><button type="button" aria-label="Close mini cart" onClick={onClose} className="pointer-events-auto absolute inset-0 bg-black/15 backdrop-blur-[2px]" /><aside className="pointer-events-auto absolute right-3 top-3 w-[min(390px,calc(100vw-24px))] rounded-[28px] bg-white p-5 shadow-[0_30px_100px_rgba(0,0,0,.2)]"><div className="flex items-center justify-between"><div><p className="text-[10px] font-black uppercase tracking-[.16em] text-emerald-700">Added to bag âœ“</p><p className="mt-1 text-sm font-black">{totals.itemCount} item{totals.itemCount === 1 ? "" : "s"} in your bag</p></div><button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full bg-black/5 font-black">Ã—</button></div><div className="mt-4 grid grid-cols-[78px_1fr] gap-3"><div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-[#ecece8]"><Image src={latest.image} alt={latest.name} fill className="object-cover" sizes="78px" /></div><div><p className="text-sm font-black leading-5">{latest.name}</p><p className="mt-1 text-xs font-bold text-black/45">Qty {latest.quantity}</p><p className="mt-2 text-sm font-black">{currency.format(latest.price * latest.quantity)}</p></div></div><div className="mt-5 grid grid-cols-2 gap-2"><button type="button" onClick={onClose} className="rounded-full border border-black/10 px-4 py-3 text-xs font-black">Keep shopping</button><Link href="/cart" onClick={onClose} className="rounded-full border border-black/10 bg-[#CDEBFF] px-4 py-3 text-center text-xs font-black text-black hover:bg-[#B8E1FA]">View bag</Link></div></aside></div>
  );
}

