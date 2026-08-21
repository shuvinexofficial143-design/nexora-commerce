import { Container } from "@/components/ui/container";
import { ProductCard } from "@/components/ui/product-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { recentProducts } from "@/lib/home-data";

export function RecentlyViewedSection() {
  return (
    <section className="py-16 sm:py-20">
      <Container>
        <SectionHeading eyebrow="Pick up where you left off" title="Recently viewed" actionLabel="View history" actionHref="/account/recent" />
        <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4 lg:gap-5">
          {recentProducts.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      </Container>
    </section>
  );
}
