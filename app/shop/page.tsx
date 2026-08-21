import type { Metadata } from "next";
import { CatalogBreadcrumbs } from "@/components/catalog/catalog-breadcrumbs";
import { CatalogHero } from "@/components/catalog/catalog-hero";
import { CatalogShell } from "@/components/catalog/catalog-shell";
import { Container } from "@/components/ui/container";
import { catalogProducts } from "@/lib/catalog-data";

export const metadata: Metadata = {
  title: "Shop All | Nexora Commerce",
  description: "Explore curated electronics, fashion, home, beauty, fitness and accessories with smart filters and premium discovery.",
};

export default function ShopPage() {
  return (
    <main className="pb-24">
      <Container>
        <CatalogBreadcrumbs />
        <CatalogHero productCount={catalogProducts.length} />
        <CatalogShell products={catalogProducts} />
      </Container>
    </main>
  );
}
