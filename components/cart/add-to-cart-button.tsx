"use client";

import { useCart } from "@/components/cart/cart-provider";
import type { CartProductSnapshot } from "@/types/cart";

export function AddToCartButton({ product, label = "Add to bag", className = "", options }: { product: CartProductSnapshot; label?: string; className?: string; options?: { color?: string; size?: string; quantity?: number } }) {
  const { addItem } = useCart();
  const unavailable = product.stock === "out-of-stock";
  return (
    <button type="button" disabled={unavailable} onClick={() => addItem(product, options)} className={className || "rounded-full bg-[#D7FF47] px-4 py-2.5 text-xs font-black text-black transition hover:bg-[#C7ED37] disabled:cursor-not-allowed disabled:bg-black/20"}>
      {unavailable ? "Notify me" : label}
    </button>
  );
}

