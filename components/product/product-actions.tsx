"use client";

import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { WishlistButton } from "@/components/cart/wishlist-button";
import { PriceDropButton } from "@/components/engagement/price-drop-button";
import { RestockAlertButton } from "@/components/engagement/restock-alert-button";
import type { CartProductSnapshot } from "@/types/cart";

export function ProductActions({
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
  if (product.stock === "out-of-stock") {
    return (
      <div className="space-y-2">
        <RestockAlertButton product={product} />
        <PriceDropButton product={product} />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[1fr_auto] gap-2">
        {ready ? <AddToCartButton
          product={product}
          options={{ color, size, choices }}
          label="Add to cart"
          className="rounded-full bg-[#D7FF47] px-5 py-3.5 text-sm font-black text-black transition hover:bg-[#C7ED37] disabled:bg-black/20 sm:py-4"
        /> : <button type="button" disabled className="rounded-full bg-black/10 px-5 py-3 text-sm font-black text-black/50">Select required options</button>}
        <WishlistButton product={product} />
      </div>
      <PriceDropButton product={product} />
    </div>
  );
}
