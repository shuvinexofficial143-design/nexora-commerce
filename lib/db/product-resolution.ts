import { ValidationError } from "@/lib/db/errors";
import { getPrisma } from "@/lib/db/prisma";

export async function resolveProductsBySlugs(input: unknown) {
  const record = (input ?? {}) as Record<string, unknown>;
  const slugs = Array.isArray(record.slugs)
    ? [...new Set(record.slugs.map((value) => String(value).trim()).filter(Boolean))].slice(0, 50)
    : [];

  if (!slugs.length) {
    throw new ValidationError("At least one product slug is required.");
  }

  const products = await getPrisma().product.findMany({
    where: {
      slug: { in: slugs },
      status: "ACTIVE",
    },
    select: {
      id: true,
      slug: true,
      name: true,
      inventory: {
        select: {
          onHand: true,
          reserved: true,
        },
      },
    },
  });

  return products.map((product) => ({
    id: product.id,
    slug: product.slug,
    name: product.name,
    availableStock: product.inventory.reduce(
      (sum, item) => sum + Math.max(0, item.onHand - item.reserved),
      0,
    ),
  }));
}
