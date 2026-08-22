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
    <article className="grid min-w-0 grid-cols-[84px_minmax(0,1fr)] gap-3 border-b border-black/10 py-4 sm:grid-cols-[132px_minmax(0,1fr)] sm:gap-4 sm:py-5">
      <Link href={`/product/${line.slug}`} className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-[#ecece8]">
        <Image src={line.image} alt={line.name} fill className="object-cover" sizes="132px" />
      </Link>

      <div className="min-w-0">
        <div className="min-w-0 sm:flex sm:items-start sm:justify-between sm:gap-4">
          <div className="min-w-0">
            <p className="truncate text-[9px] font-black uppercase tracking-[.14em] text-black/40 sm:text-[10px]">{line.brand}</p>
            <Link href={`/product/${line.slug}`}>
              <h2 className="mt-1 line-clamp-2 text-[13px] font-black leading-4 sm:text-base sm:leading-5">{line.name}</h2>
            </Link>
          </div>
          <p className="mt-1 text-sm font-black sm:mt-0 sm:shrink-0 sm:text-base">{currency.format(line.price * line.quantity)}</p>
        </div>

        {(line.color || line.size) && (
          <p className="mt-1.5 text-[11px] font-bold text-black/45 sm:mt-2 sm:text-xs">
            {line.color ? `Colour: ${line.color}` : ""}
            {line.color && line.size ? " · " : ""}
            {line.size ? `Size: ${line.size}` : ""}
          </p>
        )}

        <p className="mt-1.5 text-[11px] font-bold text-emerald-700 sm:mt-2 sm:text-xs">✓ In stock · protected checkout</p>

        <div className="mt-3 flex flex-wrap items-center gap-1.5 sm:mt-4 sm:gap-2">
          <QuantityStepper value={line.quantity} onChange={(value) => setQuantity(line.lineId, value)} />
          <button type="button" onClick={() => saveForLater(line.lineId)} className="rounded-full px-2.5 py-2 text-[11px] font-black hover:bg-black/5 sm:px-3 sm:text-xs">Save for later</button>
          <button type="button" onClick={() => removeItem(line.lineId)} className="rounded-full px-2.5 py-2 text-[11px] font-black text-red-700 hover:bg-red-50 sm:px-3 sm:text-xs">Remove</button>
        </div>
      </div>
    </article>
  );
}
