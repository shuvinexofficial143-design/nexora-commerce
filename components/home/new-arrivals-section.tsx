import Link from "next/link";
import { Container } from "@/components/ui/container";
import { ProductCard } from "@/components/ui/product-card";
import { SectionHeading } from "@/components/ui/section-heading";
import type { Product } from "@/types/commerce";

export function NewArrivalsSection({ products }: { products: Product[] }) {
  return (
    <section className="py-3 sm:py-20">
      <Container>
        <div className="sm:hidden">
          <div className="mb-2 flex items-end justify-between gap-3">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-black/40">Just landed</p>
              <h2 className="mt-0.5 text-[18px] font-black tracking-[-0.035em]">New arrivals</h2>
            </div>
            <Link href="/new-arrivals" className="text-[11px] font-black text-black/55">View all</Link>
          </div>

          <div className="grid grid-cols-2 gap-x-2.5 gap-y-3">
            {products.slice(0, 4).map((product) => (
              <ProductCard key={product.id} product={product} compact />
            ))}
          </div>
        </div>

        <div className="hidden sm:block">
          <SectionHeading
            eyebrow="Just landed"
            title="New arrivals with staying power"
            description="Fresh additions across tech, style, beauty and everyday carry."
            actionLabel="See what’s new"
            actionHref="/new-arrivals"
          />
          <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4 lg:gap-5">
            {products.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        </div>
      </Container>
    </section>
  );
}
