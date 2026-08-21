"use client";

import Link from "next/link";
import { useCart } from "@/components/cart/cart-provider";

export function CartIconLink() {
  const { totals, hydrated } = useCart();
  return (
    <Link href="/cart" className="rounded-full border border-black/10 bg-[#FFD8C7] px-4 py-2 text-sm font-bold text-black transition hover:bg-[#FFC8B4]" aria-label={`Shopping bag with ${totals.itemCount} items`}>
      Bag <span className="ml-1 text-black">{hydrated ? totals.itemCount : 0}</span>
    </Link>
  );
}

