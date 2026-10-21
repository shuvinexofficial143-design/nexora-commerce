import { getPrisma } from "@/lib/db/prisma";
import { mapBackendProductToCatalog } from "@/lib/catalog-backend";
import type { BackendProduct } from "@/types/backend";
import type { CatalogProduct } from "@/types/catalog";

export const SEARCH_PAGE_SIZE = 18;
export const SEARCH_MAX_PAGE = 100;

export type SearchSuggestion = {
  id: string;
  slug: string;
  name: string;
  priceMinor: number;
  category: string | null;
  brand: string | null;
};

export function normalizeStoreSearch(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim().replace(/\s+/g, " ").slice(0, 80);
}

export function searchTerms(value: unknown): string[] {
  const normalized = normalizeStoreSearch(value);
  if (normalized.length < 2) return [];
  return normalized.toLowerCase().split(" ").filter((part) => part.length > 0).slice(0, 8);
}

// The SQL/Prisma search is performed before take/skip, not against a
// pre-limited list of 100 products. Each token may match a different field.
export function buildProductSearchWhere(query: string) {
  const terms = searchTerms(query);
  return {
    status: "ACTIVE" as const,
    AND: terms.map((part) => ({
      OR: [
        { name: { contains: part, mode: "insensitive" as const } },
        { sku: { contains: part, mode: "insensitive" as const } },
        { shortDescription: { contains: part, mode: "insensitive" as const } },
        { brand: { is: { name: { contains: part, mode: "insensitive" as const } } } },
        { brand: { is: { slug: { contains: part, mode: "insensitive" as const } } } },
        { category: { is: { name: { contains: part, mode: "insensitive" as const } } } },
        { category: { is: { slug: { contains: part, mode: "insensitive" as const } } } },
      ],
    })),
  };
}

export function normalizeSearchPage(value: unknown) {
  const asText = typeof value === "string" ? value : "1";
  if (!/^[1-9][0-9]{0,2}$/.test(asText)) return 1;
  const numeric = Number(asText);
  return Math.min(numeric, SEARCH_MAX_PAGE);
}

const include = {
  brand: { select: { name: true, slug: true } },
  category: { select: { name: true, slug: true } },
  images: { orderBy: { sortOrder: "asc" as const }, select: { url: true, alt: true } },
  inventory: { select: { onHand: true, reserved: true } },
};

export async function searchStoreProducts(query: string, page: number): Promise<{
  products: CatalogProduct[];
  total: number;
  page: number;
  totalPages: number;
}> {
  const terms = searchTerms(query);
  if (!terms.length) return { products: [], total: 0, page: 1, totalPages: 0 };
  const where = buildProductSearchWhere(query);
  const db = getPrisma();
  const total = await db.product.count({ where });
  const totalPages = Math.ceil(total / SEARCH_PAGE_SIZE);
  const safePage = totalPages ? Math.min(normalizeSearchPage(String(page)), totalPages) : 1;
  const rows = await db.product.findMany({
    where,
    include,
    take: SEARCH_PAGE_SIZE,
    skip: (safePage - 1) * SEARCH_PAGE_SIZE,
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }, { id: "asc" }],
  });
  const products = rows.map((row) => {
    const product: BackendProduct = {
      ...row,
      createdAt: row.createdAt.toISOString(),
      availableStock: row.inventory.reduce((sum, unit) => sum + Math.max(0, unit.onHand - unit.reserved), 0),
    };
    return mapBackendProductToCatalog(product);
  });
  return { products, total, page: safePage, totalPages };
}

export async function suggestStoreProducts(query: string): Promise<SearchSuggestion[]> {
  if (searchTerms(query).length === 0) return [];
  const rows = await getPrisma().product.findMany({
    where: buildProductSearchWhere(query),
    select: {
      id: true, slug: true, name: true, priceMinor: true,
      brand: { select: { name: true } },
      category: { select: { name: true } },
    },
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }, { id: "asc" }],
    take: 7,
  });
  return rows.map((product) => ({
    id: product.id,
    slug: product.slug,
    name: product.name,
    priceMinor: product.priceMinor,
    category: product.category?.name ?? null,
    brand: product.brand?.name ?? null,
  }));
}

// Explicit opt-in for isolated browser QA only; production must never
// mistake the old demo catalog for an operational product database.
export function demoSearchEnabled(): boolean {
  return process.env.NEXORA_QA_DEMO_CATALOG === "true"
    && !process.env.DATABASE_URL;
}
