import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { demoOrders } from "@/lib/account-data";

export const metadata: Metadata = {
  title: "Track Order | Prakriti Ganesh",
  description: "Look up a Prakriti Ganesh order reference and view its current delivery status.",
};

type Props = { searchParams: Promise<{ order?: string }> };

export default async function TrackOrderPage({ searchParams }: Props) {
  const { order = "" } = await searchParams;
  const query = order.trim().toUpperCase();
  const found = query ? demoOrders.find((item) => item.id === query || item.trackingNumber === query) : undefined;

  return (
    <main className="pb-20">
      <Container className="py-10 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <p className="text-xs font-black uppercase tracking-[.2em] text-[#a54f2a]">Delivery updates</p>
          <h1 className="mt-3 text-4xl font-black tracking-[-.055em] text-[#1f3a2e] sm:text-6xl">Track your Bappa</h1>
          <p className="mt-4 text-sm font-semibold leading-6 text-black/50">Enter your order number or tracking number. Demo reference: PG82401931.</p>
          <form className="mt-6 flex gap-2"><input name="order" defaultValue={order} placeholder="PG82401931" className="h-12 min-w-0 flex-1 rounded-full border border-black/15 bg-white px-5 text-sm font-black uppercase outline-none focus:border-[#1f3a2e]" /><button className="rounded-full bg-[#1f3a2e] px-6 text-sm font-black text-white">Track</button></form>

          {query && found ? (
            <section className="mt-8 overflow-hidden rounded-[30px] border border-black/10 bg-white">
              <div className="bg-[#f4ead7] p-6"><p className="text-xs font-black uppercase tracking-[.16em] text-[#a54f2a]">{found.id}</p><div className="mt-2 flex flex-wrap items-end justify-between gap-3"><h2 className="text-3xl font-black text-[#1f3a2e]">{found.status}</h2><span className="rounded-full bg-[#1f3a2e] px-4 py-2 text-xs font-black text-white">{found.eta}</span></div></div>
              <div className="grid gap-4 p-6 sm:grid-cols-2"><div><p className="text-[10px] font-black uppercase tracking-[.16em] text-black/35">Tracking number</p><p className="mt-1 font-black">{found.trackingNumber}</p></div><div><p className="text-[10px] font-black uppercase tracking-[.16em] text-black/35">Delivery service</p><p className="mt-1 font-black">{found.deliveryLabel}</p></div><div className="sm:col-span-2"><p className="text-[10px] font-black uppercase tracking-[.16em] text-black/35">Murti</p><p className="mt-1 font-black">{found.items.map((item) => item.name).join(", ")}</p></div><div className="sm:col-span-2"><p className="text-[10px] font-black uppercase tracking-[.16em] text-black/35">Delivering to</p><p className="mt-1 text-sm font-semibold text-black/60">{found.address}</p></div></div>
            </section>
          ) : query ? (
            <div className="mt-8 rounded-[28px] border border-dashed border-black/15 bg-white p-8 text-center"><h2 className="text-2xl font-black">Order not found in demo tracking data</h2><p className="mt-2 text-sm font-semibold text-black/45">For a live database order, sign in and open your Orders dashboard.</p><Link href="/account/orders" className="mt-5 inline-flex rounded-full bg-[#1f3a2e] px-5 py-3 text-sm font-black text-white">Open my orders</Link></div>
          ) : null}
        </div>
      </Container>
    </main>
  );
}
