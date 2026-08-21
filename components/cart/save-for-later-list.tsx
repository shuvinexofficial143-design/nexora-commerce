"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/components/cart/cart-provider";
import { currency } from "@/lib/cart-utils";

export function SaveForLaterList() {
  const { saved, moveSavedToCart, removeSaved } = useCart();
  if (!saved.length) return null;
  return (
    <section className="mt-12"><div className="flex items-end justify-between"><div><p className="text-xs font-black uppercase tracking-[.16em] text-black/40">Saved</p><h2 className="mt-1 text-2xl font-black tracking-[-.04em]">Save for later</h2></div><span className="text-xs font-black text-black/40">{saved.length} item{saved.length === 1 ? "" : "s"}</span></div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">{saved.map((line) => <article key={line.lineId} className="grid grid-cols-[88px_1fr] gap-3 rounded-2xl border border-black/10 bg-white p-3"><Link href={`/product/${line.slug}`} className="relative aspect-[4/5] overflow-hidden rounded-xl bg-[#ecece8]"><Image src={line.image} alt={line.name} fill className="object-cover" sizes="88px" /></Link><div className="min-w-0"><p className="truncate text-sm font-black">{line.name}</p><p className="mt-1 text-xs font-black">{currency.format(line.price)}</p><div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={() => moveSavedToCart(line.lineId)} className="rounded-full bg-black px-3 py-2 text-[11px] font-black text-white">Move to bag</button><button type="button" onClick={() => removeSaved(line.lineId)} className="px-2 py-2 text-[11px] font-black text-black/45">Remove</button></div></div></article>)}</div>
    </section>
  );
}
