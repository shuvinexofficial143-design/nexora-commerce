import type { MetadataRoute } from "next";
import { getCatalogProducts } from "@/lib/catalog-backend";
import { getPublicAppUrl } from "@/lib/config/runtime";

const publicPages = [
  "/",
  "/shop",
  "/ai-assistant",
  "/deals/flash-sale",
  "/privacy",
  "/terms",
  "/shipping",
  "/returns-policy",
  "/contact",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getPublicAppUrl();
  const now = new Date();

  const pages: MetadataRoute.Sitemap = publicPages.map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: path === "/" || path === "/shop" ? "daily" : "monthly",
    priority: path === "/" ? 1 : path === "/shop" ? 0.9 : 0.6,
  }));

  try {
    const products = await getCatalogProducts();
    pages.push(
      ...products.map((product) => ({
        url: `${base}/product/${encodeURIComponent(product.slug)}`,
        lastModified: product.createdAt ? new Date(product.createdAt) : now,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
    );
  } catch {
    // Keep static sitemap routes available if the database is temporarily unavailable.
  }

  return pages;
}
