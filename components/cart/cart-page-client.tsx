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
    <Container className="min-w-0 overflow-hidden py-5 sm:py-12">
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[.18em] text-[#a54f2a] sm:text-xs">PRAKRITI GANESH CART</p>
          <h1 className="mt-1 text-3xl font-black tracking-[-.055em] sm:mt-2 sm:text-5xl">Your selected murtis</h1>
          <p className="mt-2 max-w-xl text-xs font-semibold text-black/45 sm:text-sm">Review size, finish and quantity before continuing to secure checkout.</p>
        </div>
        <p className="shrink-0 pb-1 text-xs font-black text-black/45 sm:text-sm">
          {hydrated ? `${totals.itemCount} item${totals.itemCount === 1 ? "" : "s"}` : "Loading cart..."}
        </p>
      </div>

      {!hydrated ? (
        <div className="mt-5 h-72 animate-pulse rounded-[24px] bg-black/5 sm:mt-8 sm:rounded-[30px]" />
      ) : !lines.length ? (
        <div className="mt-5 sm:mt-8"><EmptyCart /><SaveForLaterList /></div>
      ) : (
        <div className="mt-5 grid min-w-0 gap-5 sm:mt-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-8">
          <div className="min-w-0">
            <div className="min-w-0 overflow-hidden rounded-[24px] border border-black/10 bg-white px-3 sm:rounded-[28px] sm:px-6">
              {lines.map((line) => <CartLineItem key={line.lineId} line={line} />)}
            </div>
            <SaveForLaterList />
          </div>
          <div className="min-w-0"><CartSummary /></div>
        </div>
      )}
    </Container>
  );
}
