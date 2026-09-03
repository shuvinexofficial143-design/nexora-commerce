"use client";

import { BuyNowButton } from "@/components/cart/buy-now-button";
import { WishlistButton } from "@/components/cart/wishlist-button";
import { PriceDropButton } from "@/components/engagement/price-drop-button";
import { RestockAlertButton } from "@/components/engagement/restock-alert-button";
import { snapshotProduct } from "@/lib/cart-seed";

export function ProductActions({ unavailable, productId, color, size }: { unavailable: boolean; productId?: string; color?: string; size?: string }) {
  const product = productId ? snapshotProduct(productId) : undefined;

  if (!product) {
    return (
      <button type="button" disabled className="w-full rounded-full bg-black/15 px-5 py-4 text-sm font-black text-black/45">
        Product unavailable
      </button>
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
    <div className="space-y-3">
      <div className="rounded-[20px] border border-[#e7b84b]/30 bg-[#fff6dd] px-4 py-3 text-xs font-black text-[#7d4b1f]">
        🎉 Ganesh Chaturthi Offer · Cash on Delivery available
      </div>
      <div className="grid grid-cols-[1fr_auto] gap-2">
        <BuyNowButton productId={product.id} color={color} size={size} />
        <WishlistButton product={product} />
      </div>
      <p className="text-center text-[11px] font-bold text-black/45">Secure UPI / Card payment also available at checkout</p>
    </div>
  );
}
