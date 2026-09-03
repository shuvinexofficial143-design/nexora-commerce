import Link from "next/link";
import { HeroSection } from "@/components/home/hero-section";
import { CategoryStrip } from "@/components/home/category-strip";
import { NewArrivalsSection } from "@/components/home/new-arrivals-section";
import { Container } from "@/components/ui/container";

const ecoPoints = [
  { title: "Natural clay focus", text: "Collections built around Shadu Mati, earthy finishes and mindful materials." },
  { title: "Handcrafted", text: "Artisan-led pieces with the small variations that make handmade work feel personal." },
  { title: "Visarjan conscious", text: "A store designed around eco-friendly celebration and gentler post-festival rituals." },
];

const sizeGuide = [
  ["5–8 inch", "Compact homes & gifting"],
  ["9–15 inch", "Most home celebrations"],
  ["16–24 inch", "Premium & larger setups"],
  ["24+ inch", "Societies & community orders"],
] as const;

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <CategoryStrip />
      <NewArrivalsSection />

      <section className="py-8 sm:py-20">
        <Container>
          <div className="overflow-hidden rounded-[30px] bg-[#f4ead7] p-5 sm:rounded-[40px] sm:p-10 lg:p-14">
            <div className="grid gap-10 lg:grid-cols-[.95fr_1.05fr] lg:items-end">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#a54f2a]">Why Prakriti Ganesh</p>
                <h2 className="mt-3 max-w-2xl text-3xl font-black leading-tight tracking-[-0.05em] text-[#1f3a2e] sm:text-5xl">
                  Devotion can be beautiful without being heavy on nature.
                </h2>
                <p className="mt-5 max-w-xl text-sm leading-6 text-[#1f3a2e]/65 sm:text-base">
                  We are shaping this store around eco-friendly Ganesh murtis, transparent material choices and a cleaner shopping experience for families planning Ganesh Chaturthi.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {ecoPoints.map((point, index) => (
                  <div key={point.title} className="rounded-[24px] bg-[#fffaf0] p-5 shadow-sm">
                    <p className="text-xs font-black text-[#a54f2a]">0{index + 1}</p>
                    <h3 className="mt-6 text-lg font-black tracking-[-0.03em] text-[#1f3a2e]">{point.title}</h3>
                    <p className="mt-2 text-sm leading-5 text-[#1f3a2e]/60">{point.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="py-8 sm:py-16">
        <Container>
          <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#a54f2a]">Simple size guide</p>
              <h2 className="mt-3 text-3xl font-black tracking-[-0.05em] text-[#1f3a2e] sm:text-5xl">Choose the right Bappa for your space.</h2>
              <p className="mt-4 max-w-xl text-sm leading-6 text-[#1f3a2e]/60 sm:text-base">Start with the space you have, then compare material, finish and delivery time before ordering.</p>
              <Link href="/shop" className="mt-6 inline-flex rounded-full bg-[#1f3a2e] px-5 py-3 text-sm font-black text-white transition hover:opacity-90">Browse all sizes →</Link>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {sizeGuide.map(([size, use]) => (
                <div key={size} className="rounded-[24px] border border-[#1f3a2e]/10 bg-[#fffdf8] p-5 sm:p-7">
                  <p className="text-2xl font-black tracking-[-0.04em] text-[#1f3a2e]">{size}</p>
                  <p className="mt-2 text-xs font-bold text-[#a54f2a] sm:text-sm">{use}</p>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      <section className="py-8 sm:py-20">
        <Container>
          <div className="relative overflow-hidden rounded-[30px] bg-[#1f3a2e] px-5 py-10 text-white sm:rounded-[40px] sm:px-10 sm:py-14 lg:px-14">
            <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[#f6c453]/15 blur-3xl" />
            <div className="relative max-w-3xl">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#f6c453]">Societies · offices · community groups</p>
              <h2 className="mt-3 text-3xl font-black tracking-[-0.05em] sm:text-5xl">Need multiple murtis or a larger Ganesh?</h2>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-white/65 sm:text-base">Explore bulk-friendly sizes and gifting sets. The storefront keeps the same cart and checkout foundation as Nexora, but the experience is now built for Ganesh orders.</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/category/bulk-orders" className="rounded-full bg-[#f6c453] px-5 py-3 text-sm font-black text-[#1f3a2e]">View bulk collection</Link>
                <Link href="/shop" className="rounded-full border border-white/20 px-5 py-3 text-sm font-black text-white">Shop all</Link>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
