import { getPrisma } from "@/lib/db/prisma";
import type { BackendProduct } from "@/types/backend";

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
}): BackendProduct {
  return {
    ...product,
    images: product.images,
    availableStock: product.inventory.reduce((sum, item) => sum + Math.max(0, item.onHand - item.reserved), 0),
  };
}

const include = {
  brand: { select: { name: true, slug: true } },
  category: { select: { name: true, slug: true } },
  images: { orderBy: { sortOrder: "asc" as const }, select: { url: true, alt: true } },
  inventory: { select: { onHand: true, reserved: true } },
};

export async function listProducts(input: {
  query?: string;
  category?: string;
  brand?: string;
  limit?: number;
  offset?: number;
}) {
  const prisma = getPrisma();
  const limit = Math.min(Math.max(input.limit ?? 24, 1), 100);
  const offset = Math.max(input.offset ?? 0, 0);
  const where = {
    status: "ACTIVE" as const,
    ...(input.query
      ? { OR: [{ name: { contains: input.query, mode: "insensitive" as const } }, { sku: { contains: input.query, mode: "insensitive" as const } }] }
      : {}),
    ...(input.category ? { category: { slug: input.category } } : {}),
    ...(input.brand ? { brand: { slug: input.brand } } : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.product.findMany({ where, include, orderBy: [{ featured: "desc" }, { createdAt: "desc" }], take: limit, skip: offset }),
    prisma.product.count({ where }),
  ]);

  return { items: rows.map(serializeProduct), total, limit, offset };
}

export async function getProductBySlug(slug: string) {
  const product = await getPrisma().product.findFirst({ where: { slug, status: "ACTIVE" }, include });
  return product ? serializeProduct(product) : null;
}
