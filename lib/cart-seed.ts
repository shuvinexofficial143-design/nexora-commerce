import { catalogProducts } from "@/lib/catalog-data";
import type { CartProductSnapshot } from "@/types/cart";

export function snapshotProduct(idOrSlug: string): CartProductSnapshot | undefined {
  const product = catalogProducts.find((item) => item.id === idOrSlug || item.slug === idOrSlug);
  if (!product) return undefined;
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    brand: product.brand,
    image: product.image,
    price: product.price,
    compareAtPrice: product.compareAtPrice,
    stock: product.stock,
  };
}

export const cartRecommendations = catalogProducts.filter((item) => item.stock !== "out-of-stock").slice(8, 12);
