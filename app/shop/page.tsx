import type { Metadata } from "next";
import { CatalogBreadcrumbs } from "@/components/catalog/catalog-breadcrumbs";
import { CatalogHero } from "@/components/catalog/catalog-hero";
import { CatalogShell } from "@/components/catalog/catalog-shell";
import { Container } from "@/components/ui/container";
import { getCatalogProducts } from "@/lib/catalog-backend";
import type { SortOption } from "@/types/catalog";

export const metadata: Metadata = {
  title: "Shop All | Nexora Commerce",
  description: "Explore curated electronics, fashion, home, beauty, fitness and accessories with smart filters and premium discovery.",
};

const validSorts = new Set<SortOption>([
  "featured",
  "price-low",
  "price-high",
  "rating",
  "newest",
  "discount",
]);

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; sort?: string }>;
}) {
  const products = await getCatalogProducts();
  const query = await searchParams;
  const category = query.category?.trim().toLowerCase();
  const sort = validSorts.has(query.sort as SortOption)
    ? (query.sort as SortOption)
    : "featured";
  const key = `${category ?? "all"}:${sort}`;

  return (
    <main className="pb-24">
      <Container>
        <CatalogBreadcrumbs />
        <CatalogHero productCount={products.length} />
        <CatalogShell
          key={key}
          products={products}
          initialCategory={category}
          initialSort={sort}
        />
      </Container>
    </main>
  );
}
