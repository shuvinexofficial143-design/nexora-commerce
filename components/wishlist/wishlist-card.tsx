"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/components/cart/cart-provider";
import { currency } from "@/lib/cart-utils";
import type { WishlistItem } from "@/types/cart";

export function WishlistCard({ item }: { item: WishlistItem }) {
  const { removeWishlist, moveWishlistToCart } = useCart();
  const unavailable = item.stock === "out-of-stock";
  return <article className="group rounded-[24px] border border-black/8 bg-white p-2"><Link href={`/product/${item.slug}`} className="relative block aspect-[4/5] overflow-hidden rounded-[20px] bg-[#ecece8]"><Image src={item.image} alt={item.name} fill className="object-cover transition duration-500 group-hover:scale-[1.03]" sizes="(max-width:640px) 50vw, 25vw" />{unavailable && <span className="absolute inset-x-3 bottom-3 rounded-full bg-white/95 px-3 py-2 text-center text-[11px] font-black">Restocking soon</span>}</Link><div className="p-2 pt-3"><p className="text-[10px] font-black uppercase tracking-[.14em] text-black/40">{item.brand}</p><Link href={`/product/${item.slug}`}><h2 className="mt-1 line-clamp-2 min-h-10 text-sm font-black leading-5">{item.name}</h2></Link><p className="mt-2 text-base font-black">{currency.format(item.price)}</p><div className="mt-3 grid grid-cols-[1fr_auto] gap-2"><button type="button" disabled={unavailable} onClick={() => moveWishlistToCart(item.id)} className="rounded-full bg-black px-3 py-2.5 text-xs font-black text-white disabled:bg-black/20">{unavailable ? "Notify me" : "Add to bag"}</button><button type="button" onClick={() => removeWishlist(item.id)} className="grid w-10 place-items-center rounded-full border border-black/10 text-lg" aria-label="Remove from wishlist">×</button></div></div></article>;
}
