import { getPrisma } from "@/lib/db/prisma";
import type { BackendProduct } from "@/types/backend";
import { deserializeProductChoiceGroups } from "@/lib/commerce/product-choices";
import { publicVariant } from "@/lib/commerce/product-variants";
import { findCatalogPricePage } from "@/lib/db/catalog-price-query";
import type { Prisma } from "@/generated/prisma/client";

export function serializeProduct(product: {
  id: string;
  slug: string;
  sku: string;
  name: string;
  shortDescription: string | null;
  description: string;
  priceMinor: number;
  compareAtMinor: number | null;
  currency: string;
  rating: number;
  reviewCount: number;
  brand: { name: string; slug: string } | null;
  category: { name: string; slug: string } | null;
  images: Array<{ url: string; alt: string }>;
  inventory: Array<{ onHand: number; reserved: number }>;
  choiceGroups: Array<{ key: string; label: string; required: boolean; sortOrder: number; values: unknown }>;
  variants: Array<{ id: string; choices: unknown; signature: string; sku: string; priceMinor: number; onHand: number; reserved: number; active: boolean }>;
  createdAt: Date;
}): BackendProduct {
  return {
    ...product,
    images: product.images,
    choiceGroups: deserializeProductChoiceGroups(product.choiceGroups),
    hasPricedVariants: product.variants.length > 0,
    variants: product.variants.filter(row => row.active).map(row => publicVariant({ ...row,
      choices: row.choices as Record<string, string>,
    })),
    availableStock: product.variants.length ? product.variants.filter(row => row.active)
      .reduce((sum, item) => sum + Math.max(0, item.onHand - item.reserved), 0)
      : product.inventory.reduce((sum, item) => sum + Math.max(0, item.onHand - item.reserved), 0),
    createdAt: product.createdAt.toISOString(),
  };
}

const include = {
  brand: { select: { name: true, slug: true } },
  category: { select: { name: true, slug: true } },
  images: { orderBy: { sortOrder: "asc" as const }, select: { url: true, alt: true } },
  inventory: { select: { onHand: true, reserved: true } },
  choiceGroups: { orderBy: { sortOrder: "asc" as const }, select: { key: true, label: true, required: true, sortOrder: true, values: true } },
  variants: { select: { id: true, choices: true, signature: true, sku: true, priceMinor: true, onHand: true, reserved: true, active: true } },
};

export type ProductListQuery = {
  query?: string;
  category?: string;
  brand?: string;
  categories?: string[];
  brands?: string[];
  minPriceMinor?: number;
  maxPriceMinor?: number;
  minRating?: number;
  sort?: "featured" | "newest" | "price-low" | "price-high" | "rating";
  limit?: number;
  offset?: number;
};

export async function listProducts(input: ProductListQuery) {
  const prisma = getPrisma();
  const limit = Number.isFinite(input.limit) ? Math.min(Math.max(Math.floor(input.limit!), 1), 100) : 24;
  const offset = Number.isFinite(input.offset) ? Math.min(Math.max(Math.floor(input.offset!), 0), 1_000_000) : 0;
  const query = input.query?.trim().slice(0, 100);
  const categories = input.categories?.length ? input.categories : input.category ? [input.category] : [];
  const brands = input.brands?.length ? input.brands : input.brand ? [input.brand] : [];
  const and: Prisma.ProductWhereInput[] = [];
  if (query) {
    and.push({
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { sku: { contains: query, mode: "insensitive" } },
        { variants: { some: { sku: { contains: query, mode: "insensitive" } } } },
        { description: { contains: query, mode: "insensitive" } },
        { shortDescription: { contains: query, mode: "insensitive" } },
        { brand: { name: { contains: query, mode: "insensitive" } } },
        { category: { name: { contains: query, mode: "insensitive" } } },
      ],
    });
  }
  if (categories.length) and.push({ category: { slug: { in: categories } } });
  if (brands.length) and.push({ brand: { slug: { in: brands } } });
  if (input.minRating !== undefined) and.push({ rating: { gte: input.minRating } });

  const where: Prisma.ProductWhereInput = { status: "ACTIVE", ...(and.length ? { AND: and } : {}) };
  const orderBy: Prisma.ProductOrderByWithRelationInput[] =
    input.sort === "price-low" ? [{ priceMinor: "asc" }, { id: "asc" }] :
    input.sort === "price-high" ? [{ priceMinor: "desc" }, { id: "asc" }] :
    input.sort === "rating" ? [{ rating: "desc" }, { reviewCount: "desc" }, { id: "asc" }] :
    input.sort === "newest" ? [{ createdAt: "desc" }, { id: "asc" }] :
    [{ featured: "desc" }, { createdAt: "desc" }, { id: "asc" }];

  // SQL performs variant-aware effective price comparisons BEFORE page slicing.
  // Prisma relation aggregate cannot ORDER BY lowest active child price.
  if (input.minPriceMinor !== undefined || input.maxPriceMinor !== undefined ||
      input.sort === "price-low" || input.sort === "price-high") {
    const page = await findCatalogPricePage({
      query, categories, brands,
      minPriceMinor: input.minPriceMinor,
      maxPriceMinor: input.maxPriceMinor,
      minRating: input.minRating,
      sort: input.sort ?? "featured", limit, offset,
    });
    if (!page.ids.length) return { items: [], total: page.total, limit, offset };
    const rows = await prisma.product.findMany({ where: { id: { in: page.ids }, status: "ACTIVE" }, include });
    const byId = new Map(rows.map(row => [row.id, row]));
    return {
      items: page.ids.map(id => byId.get(id)).filter((row): row is NonNullable<typeof row> => row !== undefined)
        .map(serializeProduct),
      total: page.total, limit, offset,
    };
  }

  const [rows, total] = await Promise.all([
    prisma.product.findMany({ where, include, orderBy, take: limit, skip: offset }),
    prisma.product.count({ where }),
  ]);
  return { items: rows.map(serializeProduct), total, limit, offset };
}

export async function listPublicCatalogFacets() {
  const prisma = getPrisma();
  const [categories, brands] = await Promise.all([
    prisma.category.findMany({
      where: { products: { some: { status: "ACTIVE" } } },
      select: { slug: true, name: true },
      orderBy: { name: "asc" },
      take: 100,
    }),
    prisma.brand.findMany({
      where: { products: { some: { status: "ACTIVE" } } },
      select: { slug: true, name: true },
      orderBy: { name: "asc" },
      take: 100,
    }),
  ]);
  return { categories, brands };
}

export async function getProductBySlug(slug: string) {
  const product = await getPrisma().product.findFirst({ where: { slug, status: "ACTIVE" }, include });
  return product ? serializeProduct(product) : null;
}
