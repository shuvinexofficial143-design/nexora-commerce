"use client";

import Link from "next/link";
import { useCart } from "@/components/cart/cart-provider";

export function CartIconLink() {
  const { totals, hydrated } = useCart();
  return (
    <Link
      href="/cart"
      className="rounded-full border border-black/10 bg-[#FFD8C7] px-3 py-2 text-xs font-black text-black transition hover:bg-[#FFC8B4] sm:px-4 sm:text-sm"
      aria-label={`Shopping cart with ${totals.itemCount} items`}
    >
      Cart <span className="ml-1">{hydrated ? totals.itemCount : 0}</span>
    </Link>
  );
}
