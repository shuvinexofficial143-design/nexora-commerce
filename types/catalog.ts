import type { Product } from "@/types/commerce";

export type StockStatus = "in-stock" | "low-stock" | "out-of-stock";
export type CatalogView = "grid" | "list";
export type SortOption = "featured" | "price-low" | "price-high" | "rating" | "newest" | "discount";

export type CatalogProduct = Product & {
  source?: "database" | "demo";
  liveDescription?: string;
  liveShortDescription?: string | null;
  liveSku?: string;
  liveImages?: Array<{ src: string; alt: string }>;
  stock: StockStatus;
  inventory: number;
  delivery: string;
  popularity: number;
  createdAt: string;
  tags: string[];
};

export type CatalogFilters = {
  categories: string[];
  brands: string[];
  minPrice: number;
  maxPrice: number;
  minRating: number;
  stock: "all" | StockStatus;
  minDiscount: number;
};

export type FilterOption = {
  value: string;
  label: string;
  count: number;
};
