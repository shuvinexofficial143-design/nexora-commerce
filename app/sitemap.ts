import type { MetadataRoute } from "next";
import { catalogProducts } from "@/lib/catalog-data";
export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://nexora-commerce.vercel.app";
  const staticRoutes = ["", "/shop", "/ai-assistant", "/compare", "/deals/flash-sale"];
  return [
    ...staticRoutes.map((path) => ({ url: `${base}${path}`, lastModified: new Date(), changeFrequency: "daily" as const, priority: path === "" ? 1 : 0.8 })),
    ...catalogProducts.map((product) => ({ url: `${base}/product/${product.slug}`, lastModified: new Date(product.createdAt), changeFrequency: "weekly" as const, priority: 0.7 })),
  ];
}
