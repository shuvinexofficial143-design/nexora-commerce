import type { ProductListQuery } from "@/lib/db/products";

const slugPattern = /^[a-z0-9][a-z0-9-]{0,63}$/;
export type CatalogSearchParams = Record<string, string | string[] | undefined>;
export type LiveCatalogQuery = {
  query: string;
  categories: string[];
  brands: string[];
  minPrice: number | null;
  maxPrice: number | null;
  minRating: number | null;
  stock: ProductListQuery["stock"] | null;
  sort: NonNullable<ProductListQuery["sort"]>;
  page: number;
};
function all(params: CatalogSearchParams, name: string): string[] {
  const raw = params[name];
  return (Array.isArray(raw) ? raw : raw ? [raw] : [])
    .flatMap((value) => value.split(","))
    .map((value) => value.trim().toLowerCase())
    .filter((value) => slugPattern.test(value))
    .slice(0, 10);
}
function money(value: string | string[] | undefined): number | null {
  const str = Array.isArray(value) ? value[0] : value;
  if (!str || !/^\d{1,7}(?:\.\d{1,2})?$/.test(str)) return null;
  const parsed = Math.round(Number(str) * 100);
  return Number.isSafeInteger(parsed) && parsed <= 100_000_000 ? parsed : null;
}
function rating(value: string | string[] | undefined): number | null {
  const str = Array.isArray(value) ? value[0] : value;
  if (!str || !/^[1-5](?:\.\d)?$/.test(str)) return null;
  const parsed = Number(str);
  return parsed <= 5 ? parsed : null;
}
export function parseLiveCatalogQuery(params: CatalogSearchParams): LiveCatalogQuery {
  const rawPage = Array.isArray(params.page) ? params.page[0] : params.page;
  const rawSort = Array.isArray(params.sort) ? params.sort[0] : params.sort;
  const allowed = ["featured", "newest", "price-low", "price-high", "rating"];
  const minPrice = money(params.min);
  const maxPrice = money(params.max);
  const rawQ = Array.isArray(params.q) ? params.q[0] : params.q;
  const rawStock = Array.isArray(params.stock) ? params.stock[0] : params.stock;
  return {
    query: String(rawQ ?? "").trim().slice(0, 100),
    categories: [...new Set(all(params, "category"))],
    brands: [...new Set(all(params, "brand"))],
    minPrice,
    maxPrice,
    minRating: rating(params.rating),
    stock: rawStock === "available" || rawStock === "low-stock" || rawStock === "out-of-stock" ? rawStock : null,
    sort: allowed.includes(rawSort ?? "") ? rawSort as LiveCatalogQuery["sort"] : "featured",
    page: rawPage && /^[1-9]\d{0,3}$/.test(rawPage) ? Math.min(Number(rawPage), 1000) : 1,
  };
}
export function toProductListQuery(query: LiveCatalogQuery, limit = 24): ProductListQuery {
  return {
    query: query.query || undefined,
    categories: query.categories,
    brands: query.brands,
    minPriceMinor: query.minPrice ?? undefined,
    maxPriceMinor: query.maxPrice ?? undefined,
    minRating: query.minRating ?? undefined,
    stock: query.stock ?? undefined,
    sort: query.sort,
    limit,
    offset: (query.page - 1) * limit,
  };
}
export function catalogPageHref(path: "/shop" | "/search", query: LiveCatalogQuery, page = query.page) {
  const params = new URLSearchParams();
  if (query.query) params.set("q", query.query);
  for (const category of query.categories) params.append("category", category);
  for (const brand of query.brands) params.append("brand", brand);
  if (query.minPrice !== null) params.set("min", String(query.minPrice / 100));
  if (query.maxPrice !== null) params.set("max", String(query.maxPrice / 100));
  if (query.minRating !== null) params.set("rating", String(query.minRating));
  if (query.stock !== null) params.set("stock", query.stock);
  if (query.sort !== "featured") params.set("sort", query.sort);
  if (page > 1) params.set("page", String(page));
  const value = params.toString();
  return path + (value ? "?" + value : "");
}
// Demo catalog requires deliberate opt-in and must never silently become
// the production customer catalog when a database query fails or has no rows.
export function demoCatalogEnabled() {
  return process.env.NEXORA_QA_DEMO_CATALOG === "true" && !process.env.DATABASE_URL;
}
