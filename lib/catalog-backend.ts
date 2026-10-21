import { catalogProducts } from "@/lib/catalog-data";
import { demoCatalogEnabled } from "@/lib/storefront/catalog-query";
import { getProductBySlug, listProducts } from "@/lib/db/products";
import type { BackendProduct } from "@/types/backend";
import type { CatalogProduct } from "@/types/catalog";
import { getYouTubeThumbnail, getYouTubeVideoId, isDirectVideoUrl } from "@/lib/product-media";

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
  const inventory = Math.max(0, product.availableStock);
  const mediaUrls = product.images.map((item) => item.url).filter(Boolean);
  const directVideo = mediaUrls.find((url) => isDirectVideoUrl(url));
  const youtubeVideoId = mediaUrls.map((url) => getYouTubeVideoId(url)).find(Boolean);
  const poster =
    mediaUrls.find((url) => !isDirectVideoUrl(url) && !getYouTubeVideoId(url)) ??
    getYouTubeThumbnail(youtubeVideoId) ??
    "/product-placeholder.svg";

  const realImages = product.images
    .filter((item) => item.url && !isDirectVideoUrl(item.url) && !getYouTubeVideoId(item.url))
    .map((item) => ({ src: item.url, alt: item.alt || product.name }));
  return {
    source: "database",
    liveDescription: product.description,
    liveShortDescription: product.shortDescription,
    liveSku: product.sku,
    liveImages: realImages,
    id: product.id,
    slug: product.slug,
    name: product.name,
    brand: product.brand?.name ?? "Unbranded",
    category: product.category?.slug ?? "uncategorized",
    price: product.priceMinor / 100,
    compareAtPrice:
      product.compareAtMinor && product.compareAtMinor > product.priceMinor
        ? product.compareAtMinor / 100
        : undefined,
    rating: product.rating,
    reviews: product.reviewCount,
    badge: undefined,
    image: poster,
    videoUrl: directVideo,
    youtubeVideoId,
    colors: [],
    stock: stockStatus(inventory),
    inventory,
    delivery: inventory <= 0 ? "Currently unavailable" : "Delivery timing at checkout",
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
    if (!demoCatalogEnabled()) throw error;
    console.warn("NEXORA demo mode: database unavailable; using preview products.", error);
  }

  return demoCatalogEnabled() ? catalogProducts : [];
}

export async function getCatalogProductBySlug(slug: string): Promise<CatalogProduct | undefined> {
  try {
    const product = await getProductBySlug(slug);
    if (product) return mapBackendProductToCatalog(product);
  } catch (error) {
    if (!demoCatalogEnabled()) throw error;
    console.warn(`NEXORA demo mode: product database unavailable for ${slug}.`, error);
  }

  return demoCatalogEnabled() ? catalogProducts.find((item) => item.slug === slug) : undefined;
}
