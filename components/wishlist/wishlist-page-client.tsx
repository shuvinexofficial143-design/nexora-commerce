"use client";

import Link from "next/link";
import { Container } from "@/components/ui/container";
import { useCart } from "@/components/cart/cart-provider";
import { WishlistCard } from "@/components/wishlist/wishlist-card";

function EmptyWishlist() {
  return <div className="rounded-[32px] border border-dashed border-black/15 bg-white/70 px-6 py-16 text-center"><div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#ffefe1] text-3xl">♡</div><h2 className="mt-5 text-2xl font-black tracking-[-.04em]">Save what you love</h2><p className="mx-auto mt-2 max-w-md text-sm font-bold leading-6 text-black/45">Tap the heart on any product and it will appear here for later.</p><Link href="/shop" className="mt-6 inline-flex rounded-full bg-black px-5 py-3 text-sm font-black text-white">Discover products →</Link></div>;
}

export function WishlistPageClient() {
  const { wishlist, hydrated } = useCart();
  return <Container className="py-8 sm:py-12"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[.18em] text-black/40">Saved collection</p><h1 className="mt-2 text-4xl font-black tracking-[-.055em] sm:text-5xl">Wishlist</h1></div><p className="text-sm font-black text-black/45">{hydrated ? `${wishlist.length} saved` : "Loading…"}</p></div>{!hydrated ? <div className="mt-8 h-72 animate-pulse rounded-[30px] bg-black/5" /> : !wishlist.length ? <div className="mt-8"><EmptyWishlist /></div> : <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{wishlist.map((item) => <WishlistCard key={item.id} item={item} />)}</div>}</Container>;
}
