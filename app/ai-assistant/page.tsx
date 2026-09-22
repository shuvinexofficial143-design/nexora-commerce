import type { Metadata } from "next";
import { AiShopShell } from "@/components/ai/ai-shop-shell";
import { mapBackendProductToCatalog } from "@/lib/catalog-backend";
import { catalogProducts } from "@/lib/catalog-data";
import { listProducts } from "@/lib/db/products";

export const metadata: Metadata = {
  title: "AI Shopping Assistant | NEXORA",
  description: "Natural-language AI product discovery, recommendations and comparison for the NEXORA catalog.",
};

export const revalidate = 60;

async function loadAiCatalog() {
  try {
    const result = await listProducts({ limit: 100 });
    return result.items.map(mapBackendProductToCatalog);
  } catch (error) {
    console.warn("NEXORA AI page database catalog unavailable; using bundled fallback.", error);
    return catalogProducts;
  }
}

export default async function AiAssistantPage() {
  const products = await loadAiCatalog();
  const featured = [...products]
    .filter((product) => product.stock !== "out-of-stock")
    .sort((a, b) => b.popularity - a.popularity || b.rating - a.rating)
    .slice(0, 6);

  return <AiShopShell products={featured} />;
}
