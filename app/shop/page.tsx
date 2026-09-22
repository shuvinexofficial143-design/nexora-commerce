import type { Metadata } from "next";
import { CatalogBreadcrumbs } from "@/components/catalog/catalog-breadcrumbs";
import { CatalogHero } from "@/components/catalog/catalog-hero";
import { CatalogShell } from "@/components/catalog/catalog-shell";
import { Container } from "@/components/ui/container";
import { getCatalogProducts } from "@/lib/catalog-backend";

export const metadata: Metadata = {
  title: "Shop All | Nexora Commerce",
  description: "Explore curated electronics, fashion, home, beauty, fitness and accessories with smart filters and premium discovery.",
};

export default async function ShopPage() {
  const products = await getCatalogProducts();

  return (
    <main className="pb-24">
      <Container>
        <CatalogBreadcrumbs />
        <CatalogHero productCount={products.length} />
        <CatalogShell products={products} />
      </Container>
    </main>
  );
}
