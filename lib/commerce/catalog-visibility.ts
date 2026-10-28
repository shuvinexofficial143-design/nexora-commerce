import { Prisma, type Prisma as PrismaType } from "@/generated/prisma/client";
import { getPrisma } from "@/lib/db/prisma";

/** A category is public only if it AND every ancestor is visible, unarchived,
 * and connected to a root. UNION (not UNION ALL) also fails closed on cycles.
 * No Category ID limit: PostgreSQL resolves arbitrary hierarchy depth.
 */
export async function eligiblePublicCategoryIds(
  client: PrismaType.TransactionClient = getPrisma(),
): Promise<string[]> {
  const rows = await client.$queryRaw<Array<{ id: string }>>(Prisma.sql`
    WITH RECURSIVE eligible("id") AS (
      SELECT "id" FROM "Category"
      WHERE "parentId" IS NULL AND "visible" = TRUE AND "archived" = FALSE
      UNION
      SELECT child."id" FROM "Category" child
      JOIN eligible parent ON child."parentId" = parent."id"
      WHERE child."visible" = TRUE AND child."archived" = FALSE
    )
    SELECT "id" FROM eligible
  `);
  return rows.map(row => row.id);
}

export function publicProductVisibilityWhere(ids: readonly string[]): PrismaType.ProductWhereInput {
  return {
    AND: [
      { OR: [{ categoryId: null }, { categoryId: { in: [...ids] } }] },
      { OR: [{ brandId: null }, { brand: { is: { active: true } } }] },
    ],
  };
}

/** Use in Shop/Search, product page, cart quotes AND fresh order reservation.
 * Existing idempotent order replay deliberately bypasses this: an already
 * committed order is still retrievable if its category is subsequently hidden.
 */
export async function publicProductWhere(
  client: PrismaType.TransactionClient = getPrisma(),
): Promise<PrismaType.ProductWhereInput> {
  return publicProductVisibilityWhere(await eligiblePublicCategoryIds(client));
}
