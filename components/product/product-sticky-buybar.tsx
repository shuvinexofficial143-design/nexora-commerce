"use client";

import { useState } from "react";
import { useCart } from "@/components/cart/cart-provider";
import type { CartProductSnapshot } from "@/types/cart";

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function ProductStickyBuybar({
  product,
  color,
  size,
  choices,
  ready = true,
}: {
  product: CartProductSnapshot;
  color?: string;
  size?: string;
  choices?: Record<string,string>;
  ready?: boolean;
}) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const unavailable = product.stock === "out-of-stock" || !ready;

  function add() {
    if (unavailable) return;
    addItem(product, { color, size, choices });
    setAdded(true);
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-black/10 bg-white/94 px-3 py-2.5 shadow-[0_-12px_32px_rgba(0,0,0,.08)] backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-7xl items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] font-black">{product.name}</p>
          <p className="text-sm font-black">{currency.format(product.price)}</p>
        </div>
        <button
          type="button"
          disabled={unavailable}
          onClick={add}
          className="rounded-full bg-[#D7FF47] px-5 py-3 text-xs font-black text-black disabled:bg-black/20"
        >
          {product.stock === "out-of-stock" ? "Out of stock" : !ready ? "Select options" : added ? "Added ✓" : "Add to cart"}
        </button>
      </div>
    </div>
  );
}
