import type { Metadata } from "next";
import { CatalogBreadcrumbs } from "@/components/catalog/catalog-breadcrumbs";
import { CatalogHero } from "@/components/catalog/catalog-hero";
import { CatalogShell } from "@/components/catalog/catalog-shell";
import { Container } from "@/components/ui/container";
import { mapBackendProductToCatalog } from "@/lib/catalog-backend";
import { catalogProducts } from "@/lib/catalog-data";
import { listProducts } from "@/lib/db/products";

export const metadata: Metadata = {
  title: "Shop All | Nexora Commerce",
  description: "Explore curated electronics, fashion, home, beauty, fitness and accessories with smart filters and premium discovery.",
};

export const revalidate = 60;

async function loadCatalog() {
  try {
    const result = await listProducts({ limit: 100 });
    return result.items.map(mapBackendProductToCatalog);
  } catch (error) {
    console.warn("NEXORA storefront database catalog unavailable; using bundled fallback catalog.", error);
    return catalogProducts;
  }
}

export default async function ShopPage() {
  const products = await loadCatalog();

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
