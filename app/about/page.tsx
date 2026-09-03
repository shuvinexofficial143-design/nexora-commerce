import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "About Prakriti Ganesh",
  description: "Learn about Prakriti Ganesh and our focus on eco-conscious, artisan-led Ganesh murti collections.",
};

const values = [
  ["Eco-conscious materials", "A catalog focused on Shadu Mati, natural clay, seed and other gentler festival choices."],
  ["Artisan-led craft", "Hand-finished murtis where small variations are part of the character of handmade work."],
  ["Clear product details", "Size, finish, stock and delivery information is surfaced before checkout so families can plan better."],
];

export default function AboutPage() {
  return (
    <main className="pb-20">
      <Container className="py-10 sm:py-16">
        <section className="overflow-hidden rounded-[36px] bg-[#1f3a2e] p-7 text-white sm:p-12 lg:p-16">
          <p className="text-xs font-black uppercase tracking-[.2em] text-[#f4d7a1]">About Prakriti Ganesh</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-[-.055em] sm:text-6xl">Celebration rooted in devotion, craft and nature.</h1>
          <p className="mt-5 max-w-2xl text-base font-semibold leading-7 text-white/65">Prakriti Ganesh is designed as a focused storefront for eco-friendly Ganesh murtis—from compact home idols to premium artisan and society-scale options.</p>
        </section>
        <section className="mt-8 grid gap-4 md:grid-cols-3">
          {values.map(([title, text]) => <article key={title} className="rounded-[28px] border border-black/10 bg-white p-6"><h2 className="text-xl font-black text-[#1f3a2e]">{title}</h2><p className="mt-3 text-sm font-semibold leading-6 text-black/50">{text}</p></article>)}
        </section>
        <section className="mt-8 rounded-[32px] bg-[#f4ead7] p-7 sm:p-10"><p className="text-xs font-black uppercase tracking-[.18em] text-[#a54f2a]">Planning Ganesh Chaturthi?</p><h2 className="mt-2 text-3xl font-black tracking-[-.04em] text-[#1f3a2e]">Choose by size, material or celebration type.</h2><div className="mt-5 flex flex-wrap gap-3"><Link href="/shop" className="rounded-full bg-[#1f3a2e] px-5 py-3 text-sm font-black text-white">Shop murtis</Link><Link href="/bulk-orders" className="rounded-full border border-black/15 bg-white px-5 py-3 text-sm font-black">Society & bulk orders</Link></div></section>
      </Container>
    </main>
  );
}
