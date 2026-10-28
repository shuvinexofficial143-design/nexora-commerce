import { getYouTubeVideoId, isDirectVideoUrl } from "@/lib/product-media";

export type AdminListProduct = {
  id: string; slug: string; sku: string; name: string; description: string;
  priceMinor: number; compareAtMinor: number | null;
  status: string; featured: boolean; updatedAt: Date;
  category: { name: string; slug: string } | null;
  brand: { name: string; slug: string } | null;
  inventory: Array<{ onHand: number; reserved: number }>;
  variants: Array<{ priceMinor: number; onHand: number; reserved: number; active: boolean }>;
  images: Array<{ url: string; alt: string; sortOrder: number }>;
};

/**
 * Cline-compatible catalog metadata PLUS explicit SKU stock accounting.
 * Legacy onHand/reserved remain warehouse-only for existing Admin widgets.
 * Never let parent warehouse stock make an unavailable SKU purchasable.
 */
export function serializeAdminProductListRow(product: AdminListProduct) {
  const video = product.images.find(item =>
    isDirectVideoUrl(item.url) || Boolean(getYouTubeVideoId(item.url)));
  const poster = product.images.find(item =>
    !isDirectVideoUrl(item.url) && !getYouTubeVideoId(item.url));
  const warehouseOnHand = product.inventory.reduce((n,x) => n + x.onHand,0);
  const warehouseReserved = product.inventory.reduce((n,x) => n + x.reserved,0);
  const activeVariants = product.variants.filter(x => x.active);
  const hasVariants = product.variants.length > 0;
  const skuOnHand = activeVariants.reduce((n,x) => n + x.onHand,0);
  const skuReserved = activeVariants.reduce((n,x) => n + x.reserved,0);
  const availableStock = hasVariants ?
    activeVariants.reduce((n,x) => n + Math.max(0,x.onHand-x.reserved),0) :
    product.inventory.reduce((n,x) => n + Math.max(0,x.onHand-x.reserved),0);
  const effectivePriceMinor = hasVariants ?
    (activeVariants.length ? Math.min(...activeVariants.map(x=>x.priceMinor)) : null) :
    product.priceMinor;
  return {
    id:product.id, slug:product.slug, sku:product.sku, name:product.name,
    description:product.description,
    priceMinor:product.priceMinor, compareAtMinor:product.compareAtMinor,
    status:product.status, featured:product.featured,
    brand:product.brand?.name ?? null, brandSlug:product.brand?.slug ?? null,
    category:product.category?.name ?? null, categorySlug:product.category?.slug ?? null,
    // Legacy admin fields are intentionally warehouse-only.
    onHand:warehouseOnHand, reserved:warehouseReserved,
    stockSource:hasVariants ? "sku" as const : "warehouse" as const,
    activeVariantCount:activeVariants.length,
    totalVariantCount:product.variants.length,
    skuOnHand,skuReserved,availableStock,effectivePriceMinor,
    videoUrl:video?.url ?? null, posterUrl:poster?.url ?? null,
    media:product.images,updatedAt:product.updatedAt.toISOString(),
  };
}
