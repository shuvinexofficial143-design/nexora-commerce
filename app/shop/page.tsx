import type { Metadata } from "next";
import { CatalogBreadcrumbs } from "@/components/catalog/catalog-breadcrumbs";
import { CatalogHero } from "@/components/catalog/catalog-hero";
import { CatalogShell } from "@/components/catalog/catalog-shell";
import { Container } from "@/components/ui/container";
import { catalogProducts } from "@/lib/catalog-data";

export const metadata: Metadata = {
  title: "Shop Eco-Friendly Ganesh Murtis",
  description: "Browse handcrafted Shadu Mati, Seed Ganesh, natural-finish, premium and bulk-order friendly Ganesh murtis.",
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
