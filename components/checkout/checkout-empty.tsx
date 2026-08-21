import Link from "next/link";

export function CheckoutEmpty() {
  return <section className="mx-auto max-w-xl px-4 py-24 text-center"><div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-[#d7ff47] text-3xl">🛍️</div><h1 className="mt-6 text-4xl font-black tracking-[-.05em]">Your checkout is empty.</h1><p className="mx-auto mt-3 max-w-md text-sm font-bold leading-6 text-black/45">Add something you love to your bag, then come back here for delivery and payment.</p><Link href="/shop" className="mt-7 inline-flex rounded-full bg-black px-6 py-3.5 text-sm font-black text-white">Explore products →</Link></section>;
}
