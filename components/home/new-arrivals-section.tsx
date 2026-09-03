import Link from "next/link";
import { Container } from "@/components/ui/container";
import { ProductCard } from "@/components/ui/product-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { catalogProducts } from "@/lib/catalog-data";

export function NewArrivalsSection() {
  return (
    <section className="py-6 sm:py-16">
      <Container>
        <div className="sm:hidden">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#a54f2a]">Ganesh Chaturthi Collection</p>
              <h2 className="mt-0.5 text-[19px] font-black tracking-[-0.035em] text-[#1f3a2e]">Choose your Bappa</h2>
            </div>
            <Link href="/shop" className="text-[11px] font-black text-[#a54f2a]">Shop all</Link>
          </div>
          <div className="grid grid-cols-2 gap-x-2.5 gap-y-3">
            {catalogProducts.map((product) => <ProductCard key={product.id} product={product} compact />)}
          </div>
        </div>

        <div className="hidden sm:block">
          <SectionHeading
            eyebrow="16 Ganesh Murtis · COD Available"
            title="Pick the murti you love and buy it directly"
            description="All 16 final products are shown here with the exact current selling prices. Cash on Delivery, UPI and Card options are available at checkout."
            actionLabel="Open full shop"
            actionHref="/shop"
          />
          <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4 lg:gap-5">
            {catalogProducts.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        </div>
      </Container>
    </section>
  );
}
