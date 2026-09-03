"use client";

import { useRouter } from "next/navigation";
import { useCart } from "@/components/cart/cart-provider";
import { snapshotProduct } from "@/lib/cart-seed";

export function BuyNowButton({ productId, compact = false, color, size }: { productId: string; compact?: boolean; color?: string; size?: string }) {
  const router = useRouter();
  const { buyNow } = useCart();
  const product = snapshotProduct(productId);
  const unavailable = !product || product.stock === "out-of-stock";

  return (
    <button
      type="button"
      disabled={unavailable}
      onClick={() => {
        if (!product) return;
        buyNow(product, { color, size });
        router.push("/checkout");
      }}
      className={`${compact ? "min-h-10 px-3 text-[11px]" : "min-h-11 px-4 text-xs sm:text-sm"} rounded-full bg-[#1f3a2e] font-black text-white transition hover:bg-[#14291f] disabled:cursor-not-allowed disabled:bg-black/20`}
    >
      {unavailable ? "Out of stock" : "Buy Now"}
    </button>
  );
}
