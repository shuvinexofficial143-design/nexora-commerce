import { catalogProducts } from "@/lib/catalog-data";
import { getProductBySlug, listProducts } from "@/lib/db/products";
import type { BackendProduct } from "@/types/backend";
import type { CatalogProduct } from "@/types/catalog";
import { getYouTubeThumbnail, getYouTubeVideoId, isDirectVideoUrl } from "@/lib/product-media";

const fallbackImage =
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80";

function stockStatus(availableStock: number): CatalogProduct["stock"] {
  if (availableStock <= 0) return "out-of-stock";
  if (availableStock <= 8) return "low-stock";
  return "in-stock";
}

function tags(product: BackendProduct) {
  return Array.from(
    new Set(
      [
        product.brand?.name,
        product.category?.name,
        ...product.name.split(/\s+/),
        ...product.description.split(/\s+/),
      ]
        .filter(Boolean)
        .map((value) => String(value).toLowerCase().replace(/[^a-z0-9-]/g, ""))
        .filter((value) => value.length > 2),
    ),
  ).slice(0, 12);
}

export function mapBackendProductToCatalog(product: BackendProduct): CatalogProduct {
  const fallback = catalogProducts.find((item) => item.slug === product.slug);
  const inventory = Math.max(0, product.availableStock);
  const mediaUrls = product.images.map((item) => item.url).filter(Boolean);
  const directVideo = mediaUrls.find((url) => isDirectVideoUrl(url));
  const youtubeVideoId = mediaUrls.map((url) => getYouTubeVideoId(url)).find(Boolean);
  const poster =
    mediaUrls.find((url) => !isDirectVideoUrl(url) && !getYouTubeVideoId(url)) ??
    getYouTubeThumbnail(youtubeVideoId) ??
    fallback?.image ??
    fallbackImage;

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    brand: product.brand?.name ?? fallback?.brand ?? "NEXORA",
    category: product.category?.slug ?? fallback?.category ?? "uncategorized",
    price: product.priceMinor / 100,
    compareAtPrice:
      product.compareAtMinor && product.compareAtMinor > product.priceMinor
        ? product.compareAtMinor / 100
        : undefined,
    rating: product.rating,
    reviews: product.reviewCount,
    badge: fallback?.badge,
    image: poster,
    videoUrl: directVideo,
    youtubeVideoId,
    colors: fallback?.colors ?? [],
    stock: stockStatus(inventory),
    inventory,
    delivery: inventory <= 0 ? "Restocking soon" : inventory <= 8 ? "2 days" : "Tomorrow",
    popularity: Math.min(100, Math.round(product.rating * 18 + Math.min(product.reviewCount, 1000) / 100)),
    createdAt: product.createdAt,
    tags: tags(product),
  };
}

export async function getCatalogProducts(): Promise<CatalogProduct[]> {
  try {
    const result = await listProducts({ limit: 100 });
    if (result.items.length > 0) {
      return result.items.map(mapBackendProductToCatalog);
    }
  } catch (error) {
    console.warn("NEXORA catalog database unavailable; using fallback catalog.", error);
  }

  return catalogProducts;
}

export async function getCatalogProductBySlug(slug: string): Promise<CatalogProduct | undefined> {
  try {
    const product = await getProductBySlug(slug);
    if (product) return mapBackendProductToCatalog(product);
  } catch (error) {
    console.warn(`NEXORA product database unavailable for ${slug}; using fallback catalog.`, error);
  }

  return catalogProducts.find((item) => item.slug === slug);
}
