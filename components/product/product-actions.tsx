"use client";

import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { WishlistButton } from "@/components/cart/wishlist-button";
import { PriceDropButton } from "@/components/engagement/price-drop-button";
import { RestockAlertButton } from "@/components/engagement/restock-alert-button";
import { snapshotProduct } from "@/lib/cart-seed";

export function ProductActions({
  unavailable,
  productId,
  color,
  size,
}: {
  unavailable: boolean;
  productId?: string;
  color?: string;
  size?: string;
}) {
  const product = productId ? snapshotProduct(productId) : undefined;

  if (!product) {
    return (
      <div className="grid grid-cols-[1fr_auto] gap-2">
        <button
          type="button"
          disabled={unavailable}
          className="rounded-full bg-[#D7FF47] px-5 py-3.5 text-sm font-black text-black disabled:bg-black/20 sm:py-4"
        >
          {unavailable ? "Notify me when available" : "Add to cart"}
        </button>
        <button
          type="button"
          aria-label="Save to wishlist"
          className="grid w-14 place-items-center rounded-full border border-black/10 bg-white text-xl"
        >
          ♡
        </button>
      </div>
    );
  }

  if (unavailable) {
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
        <AddToCartButton
          product={product}
          options={{ color, size }}
          label="Add to cart"
          className="rounded-full bg-[#D7FF47] px-5 py-3.5 text-sm font-black text-black transition hover:bg-[#C7ED37] disabled:bg-black/20 sm:py-4"
        />
        <WishlistButton product={product} />
      </div>
      <PriceDropButton product={product} />
    </div>
  );
}
