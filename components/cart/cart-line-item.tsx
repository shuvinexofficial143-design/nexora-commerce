"use client";

import Image from "next/image";
import Link from "next/link";
import { QuantityStepper } from "@/components/cart/quantity-stepper";
import { useCart } from "@/components/cart/cart-provider";
import { currency } from "@/lib/cart-utils";
import type { CartLine } from "@/types/cart";

export function CartLineItem({ line }: { line: CartLine }) {
  const { removeItem, setQuantity, saveForLater } = useCart();
  return (
    <article className="grid grid-cols-[96px_1fr] gap-4 border-b border-black/10 py-5 sm:grid-cols-[132px_1fr]">
      <Link href={`/product/${line.slug}`} className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-[#ecece8]"><Image src={line.image} alt={line.name} fill className="object-cover" sizes="132px" /></Link>
      <div className="min-w-0">
        <div className="flex items-start justify-between gap-4">
          <div><p className="text-[10px] font-black uppercase tracking-[.14em] text-black/40">{line.brand}</p><Link href={`/product/${line.slug}`}><h2 className="mt-1 text-sm font-black sm:text-base">{line.name}</h2></Link></div>
          <p className="shrink-0 text-sm font-black sm:text-base">{currency.format(line.price * line.quantity)}</p>
        </div>
        {(line.color || line.size) && <p className="mt-2 text-xs font-bold text-black/45">{line.color ? `Colour: ${line.color}` : ""}{line.color && line.size ? " · " : ""}{line.size ? `Size: ${line.size}` : ""}</p>}
        <p className="mt-2 text-xs font-bold text-emerald-700">✓ In stock · protected checkout</p>
        <div className="mt-4 flex flex-wrap items-center gap-2"><QuantityStepper value={line.quantity} onChange={(value) => setQuantity(line.lineId, value)} /><button type="button" onClick={() => saveForLater(line.lineId)} className="rounded-full px-3 py-2 text-xs font-black hover:bg-black/5">Save for later</button><button type="button" onClick={() => removeItem(line.lineId)} className="rounded-full px-3 py-2 text-xs font-black text-red-700 hover:bg-red-50">Remove</button></div>
      </div>
    </article>
  );
}
