import Link from "next/link";

export function EmptyCart() {
  return <div className="rounded-[32px] border border-dashed border-black/15 bg-white/70 px-6 py-16 text-center"><div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#d7ff47] text-2xl">🛍</div><h2 className="mt-5 text-2xl font-black tracking-[-.04em]">Your bag is waiting</h2><p className="mx-auto mt-2 max-w-md text-sm font-bold leading-6 text-black/45">Explore the catalogue and add products here. Your bag stays saved on this device automatically.</p><Link href="/shop" className="mt-6 inline-flex rounded-full bg-black px-5 py-3 text-sm font-black text-white">Explore products →</Link></div>;
}
