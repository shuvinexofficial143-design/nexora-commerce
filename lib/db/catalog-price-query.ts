import type { Prisma as PrismaType } from "@/generated/prisma/client";
import { Prisma } from "@/generated/prisma/client";
import { getPrisma } from "@/lib/db/prisma";

/**
 * Selects IDs using the same effective price the storefront actually displays:
 * lowest ACTIVE SKU price, otherwise the base product price.
 *
 * All predicates, totals and paging are resolved inside PostgreSQL. In
 * particular, an eligible expensive variant must not make a cheaper displayed
 * minimum pass a higher minimum-price filter. Never page an in-memory shortlist.
 * Values are parameterized; ORDER BY choices are fixed trusted SQL fragments.
 */
export async function findCatalogPricePage(input: {
  query?: string;
  categories: string[];
  brands: string[];
  minPriceMinor?: number;
  maxPriceMinor?: number;
  minRating?: number;
  sort: "featured" | "newest" | "rating" | "price-low" | "price-high";
  limit: number;
  offset: number;
}): Promise<{ ids: string[]; total: number }> {
  const conditions: PrismaType.Sql[] = [Prisma.sql`p."status" = 'ACTIVE'`];
  if (input.query) {
    const pattern = "%" + input.query + "%";
    conditions.push(Prisma.sql`(
      p."name" ILIKE ${pattern} OR p."sku" ILIKE ${pattern}
      OR p."description" ILIKE ${pattern}
      OR p."shortDescription" ILIKE ${pattern}
      OR b."name" ILIKE ${pattern} OR c."name" ILIKE ${pattern}
      OR EXISTS (
        SELECT 1 FROM "ProductVariant" vsearch
        WHERE vsearch."productId" = p."id"
          AND vsearch."sku" ILIKE ${pattern}
      )
    )`);
  }
  if (input.categories.length) {
    conditions.push(Prisma.sql`c."slug" IN (${Prisma.join(input.categories)})`);
  }
  if (input.brands.length) {
    conditions.push(Prisma.sql`b."slug" IN (${Prisma.join(input.brands)})`);
  }
  if (input.minRating !== undefined) {
    conditions.push(Prisma.sql`p."rating" >= ${input.minRating}`);
  }
  if (input.minPriceMinor !== undefined) {
    conditions.push(Prisma.sql`COALESCE(priced."minPrice", p."priceMinor") >= ${input.minPriceMinor}`);
  }
  if (input.maxPriceMinor !== undefined) {
    conditions.push(Prisma.sql`COALESCE(priced."minPrice", p."priceMinor") <= ${input.maxPriceMinor}`);
  }
  const from = Prisma.sql`
    FROM "Product" p
    LEFT JOIN "Brand" b ON b."id" = p."brandId"
    LEFT JOIN "Category" c ON c."id" = p."categoryId"
    LEFT JOIN LATERAL (
      SELECT MIN(v."priceMinor") AS "minPrice"
      FROM "ProductVariant" v
      WHERE v."productId" = p."id" AND v."active" = TRUE
    ) priced ON TRUE
    WHERE ${Prisma.join(conditions, " AND ")}
  `;
  const orderBy =
    input.sort === "price-low" ? Prisma.sql`COALESCE(priced."minPrice", p."priceMinor") ASC, p."id" ASC`
    : input.sort === "price-high" ? Prisma.sql`COALESCE(priced."minPrice", p."priceMinor") DESC, p."id" ASC`
    : input.sort === "rating" ? Prisma.sql`p."rating" DESC, p."reviewCount" DESC, p."id" ASC`
    : input.sort === "newest" ? Prisma.sql`p."createdAt" DESC, p."id" ASC`
    : Prisma.sql`p."featured" DESC, p."createdAt" DESC, p."id" ASC`;
  const prisma = getPrisma();
  const [totalRow, page] = await Promise.all([
    prisma.$queryRaw<Array<{ total: number }>>(Prisma.sql`
      SELECT COUNT(*)::int AS "total" ${from}
    `),
    prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      SELECT p."id" ${from}
      ORDER BY ${orderBy}
      LIMIT ${input.limit} OFFSET ${input.offset}
    `),
  ]);
  return { ids: page.map(item => item.id), total: totalRow[0]?.total ?? 0 };
}
