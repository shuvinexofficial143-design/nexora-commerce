import { Container } from "@/components/ui/container";
import { ProductCard } from "@/components/ui/product-card";
import { SectionHeading } from "@/components/ui/section-heading";
import type { Product } from "@/types/commerce";

export function RecentlyViewedSection({ products }: { products: Product[] }) {
  return (
    <section className="py-16 sm:py-20">
      <Container>
        <SectionHeading eyebrow="Pick up where you left off" title="More from the live catalog" actionLabel="Shop all" actionHref="/shop" />
        <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4 lg:gap-5">
          {products.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      </Container>
    </section>
  );
}
