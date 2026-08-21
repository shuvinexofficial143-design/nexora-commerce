import type { CatalogFilters, CatalogProduct, FilterOption, SortOption } from "@/types/catalog";

export const CATALOG_PRICE_MIN = 0;
export const CATALOG_PRICE_MAX = 30000;

export const defaultCatalogFilters: CatalogFilters = {
  categories: [],
  brands: [],
  minPrice: CATALOG_PRICE_MIN,
  maxPrice: CATALOG_PRICE_MAX,
  minRating: 0,
  stock: "all",
  minDiscount: 0,
};

export function getDiscount(product: CatalogProduct) {
  if (!product.compareAtPrice || product.compareAtPrice <= product.price) return 0;
  return Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100);
}

export function filterCatalogProducts(products: CatalogProduct[], filters: CatalogFilters, sort: SortOption) {
  const filtered = products.filter((product) => {
    if (filters.categories.length && !filters.categories.includes(product.category)) return false;
    if (filters.brands.length && !filters.brands.includes(product.brand)) return false;
    if (product.price < filters.minPrice || product.price > filters.maxPrice) return false;
    if (product.rating < filters.minRating) return false;
    if (filters.stock !== "all" && product.stock !== filters.stock) return false;
    if (getDiscount(product) < filters.minDiscount) return false;
    return true;
  });

  return [...filtered].sort((a, b) => {
    if (sort === "price-low") return a.price - b.price;
    if (sort === "price-high") return b.price - a.price;
    if (sort === "rating") return b.rating - a.rating || b.reviews - a.reviews;
    if (sort === "newest") return Date.parse(b.createdAt) - Date.parse(a.createdAt);
    if (sort === "discount") return getDiscount(b) - getDiscount(a);
    return b.popularity - a.popularity;
  });
}

export function buildFilterOptions(products: CatalogProduct[], key: "category" | "brand"): FilterOption[] {
  const counts = new Map<string, number>();
  for (const product of products) {
    const value = product[key];
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([value, count]) => ({
      value,
      label: value
        .split("-")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" "),
      count,
    }));
}

export function countActiveFilters(filters: CatalogFilters) {
  let count = filters.categories.length + filters.brands.length;
  if (filters.minPrice !== CATALOG_PRICE_MIN || filters.maxPrice !== CATALOG_PRICE_MAX) count += 1;
  if (filters.minRating > 0) count += 1;
  if (filters.stock !== "all") count += 1;
  if (filters.minDiscount > 0) count += 1;
  return count;
}
