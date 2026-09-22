import { catalogProducts } from "@/lib/catalog-data";
import type { BackendProduct } from "@/types/backend";
import type { CatalogProduct, StockStatus } from "@/types/catalog";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80";

function stockStatus(availableStock: number): StockStatus {
  if (availableStock <= 0) return "out-of-stock";
  if (availableStock <= 8) return "low-stock";
  return "in-stock";
}

function safeImage(candidate: string | undefined, fallback: string | undefined) {
  if (!candidate) return fallback ?? FALLBACK_IMAGE;
  if (candidate.startsWith("/")) return candidate;

  try {
    const url = new URL(candidate);
    if (url.protocol === "https:" && url.hostname === "images.unsplash.com") return candidate;
  } catch {
    // Ignore malformed external image URLs and use a safe storefront fallback.
  }

  return fallback ?? FALLBACK_IMAGE;
}

export function mapBackendProductToCatalog(product: BackendProduct): CatalogProduct {
  const legacy = catalogProducts.find((item) => item.slug === product.slug);
  const stock = stockStatus(product.availableStock);
  const brand = product.brand?.name ?? legacy?.brand ?? "NEXORA";
  const category = product.category?.slug ?? legacy?.category ?? "general";

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    brand,
    category,
    price: product.priceMinor / 100,
    compareAtPrice: product.compareAtMinor ? product.compareAtMinor / 100 : undefined,
    rating: product.rating,
    reviews: product.reviewCount,
    badge: legacy?.badge,
    image: safeImage(product.images[0]?.url, legacy?.image),
    colors: legacy?.colors ?? [],
    stock,
    inventory: product.availableStock,
    delivery:
      stock === "out-of-stock"
        ? "Restocking soon"
        : stock === "low-stock"
          ? "2 days"
          : legacy?.delivery ?? "Tomorrow",
    popularity: legacy?.popularity ?? Math.min(99, Math.max(1, Math.round(product.rating * 20))),
    createdAt: product.createdAt.slice(0, 10),
    tags: legacy?.tags ?? [brand.toLowerCase(), category.toLowerCase(), product.slug],
  };
}
