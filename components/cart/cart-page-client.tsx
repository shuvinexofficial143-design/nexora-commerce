"use client";

import { Container } from "@/components/ui/container";
import { CartLineItem } from "@/components/cart/cart-line-item";
import { CartSummary } from "@/components/cart/cart-summary";
import { EmptyCart } from "@/components/cart/empty-cart";
import { SaveForLaterList } from "@/components/cart/save-for-later-list";
import { useCart } from "@/components/cart/cart-provider";

export function CartPageClient() {
  const { lines, totals, hydrated } = useCart();
  return (
    <Container className="py-8 sm:py-12"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[.18em] text-black/40">NEXORA BAG</p><h1 className="mt-2 text-4xl font-black tracking-[-.055em] sm:text-5xl">Your cart</h1></div><p className="text-sm font-black text-black/45">{hydrated ? `${totals.itemCount} item${totals.itemCount === 1 ? "" : "s"}` : "Loading bag…"}</p></div>
      {!hydrated ? <div className="mt-8 h-72 animate-pulse rounded-[30px] bg-black/5" /> : !lines.length ? <div className="mt-8"><EmptyCart /><SaveForLaterList /></div> : <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]"><div><div className="rounded-[28px] border border-black/10 bg-white px-4 sm:px-6">{lines.map((line) => <CartLineItem key={line.lineId} line={line} />)}</div><SaveForLaterList /></div><CartSummary /></div>}
    </Container>
  );
}
