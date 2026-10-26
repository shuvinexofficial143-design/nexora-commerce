import { getPrisma } from "@/lib/db/prisma";
import type { BackendProduct } from "@/types/backend";
import { deserializeProductChoiceGroups } from "@/lib/commerce/product-choices";
import type { Prisma } from "@/generated/prisma/client";

function serializeProduct(product: {
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
  createdAt: Date;
}): BackendProduct {
  return {
    ...product,
    images: product.images,
    choiceGroups: deserializeProductChoiceGroups(product.choiceGroups),
    availableStock: product.inventory.reduce((sum, item) => sum + Math.max(0, item.onHand - item.reserved), 0),
    createdAt: product.createdAt.toISOString(),
  };
}

const include = {
  brand: { select: { name: true, slug: true } },
  category: { select: { name: true, slug: true } },
  images: { orderBy: { sortOrder: "asc" as const }, select: { url: true, alt: true } },
  inventory: { select: { onHand: true, reserved: true } },
  choiceGroups: { orderBy: { sortOrder: "asc" as const }, select: { key: true, label: true, required: true, sortOrder: true, values: true } },
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
        { description: { contains: query, mode: "insensitive" } },
        { shortDescription: { contains: query, mode: "insensitive" } },
        { brand: { name: { contains: query, mode: "insensitive" } } },
        { category: { name: { contains: query, mode: "insensitive" } } },
      ],
    });
  }
  if (categories.length) and.push({ category: { slug: { in: categories } } });
  if (brands.length) and.push({ brand: { slug: { in: brands } } });
  if (input.minPriceMinor !== undefined) and.push({ priceMinor: { gte: input.minPriceMinor } });
  if (input.maxPriceMinor !== undefined) and.push({ priceMinor: { lte: input.maxPriceMinor } });
  if (input.minRating !== undefined) and.push({ rating: { gte: input.minRating } });

  const where: Prisma.ProductWhereInput = { status: "ACTIVE", ...(and.length ? { AND: and } : {}) };
  const orderBy: Prisma.ProductOrderByWithRelationInput[] =
    input.sort === "price-low" ? [{ priceMinor: "asc" }, { id: "asc" }] :
    input.sort === "price-high" ? [{ priceMinor: "desc" }, { id: "asc" }] :
    input.sort === "rating" ? [{ rating: "desc" }, { reviewCount: "desc" }, { id: "asc" }] :
    input.sort === "newest" ? [{ createdAt: "desc" }, { id: "asc" }] :
    [{ featured: "desc" }, { createdAt: "desc" }, { id: "asc" }];

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
