import type { Prisma } from "@/generated/prisma/client";
import { requireAssignableBrand, requireAssignableCategory, validateProductAttributes } from "@/lib/admin/catalog-admin";

// Validate the effective persisted product, not only the submitted patch.
// Existing catalog permits uncategorized products. An assigned category/brand
// must nevertheless be active, and all category-required attributes must be valid.
export async function assertProductPublishable(
  tx: Prisma.TransactionClient,
  product: { categoryId: string | null; brandId: string | null; attributes: Prisma.JsonValue | null },
) {
  if (product.categoryId) {
    const category = await tx.category.findUnique({
      where: { id: product.categoryId }, select: { id: true, visible: true, archived: true },
    });
    requireAssignableCategory(category);
    const definitions = await tx.attributeDefinition.findMany({
      where: { categoryId: product.categoryId },
      select: { slug: true, name: true, type: true, required: true, active: true, options: true },
    });
    validateProductAttributes(definitions, product.attributes);
  }
  if (product.brandId) {
    const brand = await tx.brand.findUnique({
      where: { id: product.brandId }, select: { id: true, active: true },
    });
    requireAssignableBrand(brand);
  }
}
