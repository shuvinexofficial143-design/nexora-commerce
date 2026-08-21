import { Container } from "@/components/ui/container";
import { PromoCard } from "@/components/ui/promo-card";
import { promos } from "@/lib/home-data";

export function PromoGrid() {
  return (
    <section className="py-10 sm:py-14">
      <Container>
        <div className="grid gap-4 lg:grid-cols-2">
          <PromoCard promo={promos[1]} />
          <PromoCard promo={promos[2]} />
        </div>
      </Container>
    </section>
  );
}
