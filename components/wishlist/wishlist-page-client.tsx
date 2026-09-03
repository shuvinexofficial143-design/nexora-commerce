"use client";

import Link from "next/link";
import { Container } from "@/components/ui/container";
import { useCart } from "@/components/cart/cart-provider";
import { WishlistCard } from "@/components/wishlist/wishlist-card";

function EmptyWishlist() {
  return (
    <div className="rounded-[32px] border border-dashed border-black/15 bg-[#fffaf0] px-6 py-16 text-center">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#f4d7a1] text-3xl">♡</div>
      <h2 className="mt-5 text-2xl font-black tracking-[-.04em] text-[#1f3a2e]">Save your favourite Bappa</h2>
      <p className="mx-auto mt-2 max-w-md text-sm font-bold leading-6 text-black/45">Heart any murti while browsing and keep your shortlist here before choosing the right size, material and finish.</p>
      <Link href="/shop" className="mt-6 inline-flex rounded-full bg-[#1f3a2e] px-5 py-3 text-sm font-black text-white">Explore Ganesh murtis →</Link>
    </div>
  );
}

export function WishlistPageClient() {
  const { wishlist, hydrated } = useCart();
  return (
    <Container className="py-8 sm:py-12">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[.18em] text-[#a54f2a]">Your festival shortlist</p>
          <h1 className="mt-2 text-4xl font-black tracking-[-.055em] text-[#1f3a2e] sm:text-5xl">Saved murtis</h1>
        </div>
        <p className="text-sm font-black text-black/45">{hydrated ? `${wishlist.length} saved` : "Loading…"}</p>
      </div>
      {!hydrated ? <div className="mt-8 h-72 animate-pulse rounded-[30px] bg-black/5" /> : !wishlist.length ? <div className="mt-8"><EmptyWishlist /></div> : <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{wishlist.map((item) => <WishlistCard key={item.id} item={item} />)}</div>}
    </Container>
  );
}
