import Link from "next/link";
import { Container } from "@/components/ui/container";
import { ProductCard } from "@/components/ui/product-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { newArrivalProducts } from "@/lib/home-data";

export function NewArrivalsSection() {
  return (
    <section className="py-4 sm:py-20">
      <Container>
        <div className="sm:hidden">
          <div className="mb-2 flex items-end justify-between gap-3">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#a54f2a]">Ganesh Chaturthi 2026</p>
              <h2 className="mt-0.5 text-[18px] font-black tracking-[-0.035em] text-[#1f3a2e]">Fresh handcrafted picks</h2>
            </div>
            <Link href="/shop" className="text-[11px] font-black text-[#a54f2a]">View all</Link>
          </div>

          <div className="grid grid-cols-2 gap-x-2.5 gap-y-3">
            {newArrivalProducts.slice(0, 4).map((product) => (
              <ProductCard key={product.id} product={product} compact />
            ))}
          </div>
        </div>

        <div className="hidden sm:block">
          <SectionHeading
            eyebrow="Ganesh Chaturthi 2026"
            title="Handcrafted murtis for this year’s celebration"
            description="Choose by size, material and finish — from compact home murtis to premium artisan pieces."
            actionLabel="Shop all murtis"
            actionHref="/shop"
          />
          <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4 lg:gap-5">
            {newArrivalProducts.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        </div>
      </Container>
    </section>
  );
}
