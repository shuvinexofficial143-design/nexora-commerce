import { Container } from "@/components/ui/container";
import { ProductCard } from "@/components/ui/product-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { newArrivalProducts } from "@/lib/home-data";

export function NewArrivalsSection() {
  return (
    <section className="py-16 sm:py-20">
      <Container>
        <SectionHeading
          eyebrow="Just landed"
          title="New arrivals with staying power"
          description="Fresh additions across tech, style, beauty and everyday carry."
          actionLabel="See what’s new"
          actionHref="/new-arrivals"
        />
        <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4 lg:gap-5">
          {newArrivalProducts.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      </Container>
    </section>
  );
}
