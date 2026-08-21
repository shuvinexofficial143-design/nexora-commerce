import { Container } from "@/components/ui/container";
import { PromoCard } from "@/components/ui/promo-card";
import { promos } from "@/lib/home-data";

export function EditorialBanner() {
  return (
    <section className="py-8 sm:py-12">
      <Container>
        <PromoCard promo={promos[0]} large />
      </Container>
    </section>
  );
}
