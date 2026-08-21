"use client";

import { useCart } from "@/components/cart/cart-provider";
import type { CartProductSnapshot } from "@/types/cart";

export function WishlistButton({ product, compact = false }: { product: CartProductSnapshot; compact?: boolean }) {
  const { toggleWishlist, isWishlisted } = useCart();
  const active = isWishlisted(product.id);
  return (
    <button type="button" onClick={() => toggleWishlist(product)} aria-label={active ? "Remove from wishlist" : "Save to wishlist"} className={compact ? `grid h-9 w-9 place-items-center rounded-full text-lg shadow-sm backdrop-blur ${active ? "bg-[#d7ff47]" : "bg-white/90"}` : `grid w-14 place-items-center rounded-full border text-xl transition ${active ? "border-black bg-[#d7ff47]" : "border-black/10 bg-white hover:border-black/30"}`}>
      {active ? "♥" : "♡"}
    </button>
  );
}
