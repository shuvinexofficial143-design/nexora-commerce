import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import type { Product } from "@/types/commerce";
import { FlashCountdown } from "./flash-countdown";
import { ProductCarousel } from "./product-carousel";

export function FlashDealsSection({ products }: { products: Product[] }) {
  return (
    <section className="py-16 sm:py-20">
      <Container>
        <div className="rounded-[34px] bg-[#d7ff47] p-5 sm:p-8 lg:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <SectionHeading
              eyebrow="Flash drop"
              title="Prices moving fast."
              description="A short window of sharper pricing on some of the most wanted picks."
              actionLabel="View all deals"
              actionHref="/deals"
            />
            <FlashCountdown />
          </div>
          <ProductCarousel products={products} />
        </div>
      </Container>
    </section>
  );
}
