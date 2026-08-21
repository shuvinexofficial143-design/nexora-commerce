import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { BrandLogo } from "@/components/ui/brand-logo";
import { brands } from "@/lib/home-data";

export function FeaturedBrands() {
  return (
    <section className="py-14 sm:py-18">
      <Container>
        <SectionHeading eyebrow="Names to know" title="Featured brands" actionLabel="All brands" actionHref="/brands" />
        <div className="mt-7 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {brands.map((brand) => <BrandLogo key={brand.name} brand={brand} />)}
        </div>
      </Container>
    </section>
  );
}
