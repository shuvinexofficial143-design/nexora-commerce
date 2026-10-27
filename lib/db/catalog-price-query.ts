import type { Prisma as PrismaType } from "@/generated/prisma/client";
import { Prisma } from "@/generated/prisma/client";
import { getPrisma } from "@/lib/db/prisma";

export type CatalogStockFilter = "available" | "low-stock" | "out-of-stock";

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
  queryTerms?: string[];
  stock?: CatalogStockFilter;
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
  // Each keyword matches any live catalog field; terms are combined by AND.
  const searchPredicate = (term: string): PrismaType.Sql => {
    const pattern = "%" + term + "%";
    return Prisma.sql`(
      p."name" ILIKE ${pattern} OR p."sku" ILIKE ${pattern}
      OR p."description" ILIKE ${pattern}
      OR p."shortDescription" ILIKE ${pattern}
      OR b."name" ILIKE ${pattern} OR b."slug" ILIKE ${pattern}
      OR c."name" ILIKE ${pattern} OR c."slug" ILIKE ${pattern}
      OR EXISTS (
        SELECT 1 FROM "ProductVariant" vsearch
        WHERE vsearch."productId" = p."id" AND vsearch."active" = TRUE
          AND vsearch."sku" ILIKE ${pattern}
      )
    )`;
  };
  if (input.query) conditions.push(searchPredicate(input.query));
  for (const term of input.queryTerms ?? []) conditions.push(searchPredicate(term));
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
  // Product detail and checkout do not fall back to parent warehouse stock
  // if independently stocked SKU rows (even disabled rows) already exist.
  const availableUnits = Prisma.sql`CASE WHEN sku_stock."variantCount" > 0
    THEN sku_stock."available" ELSE warehouse_stock."available" END`;
  if (input.stock === "available") conditions.push(Prisma.sql`${availableUnits} > 0`);
  else if (input.stock === "low-stock") conditions.push(Prisma.sql`${availableUnits} BETWEEN 1 AND 8`);
  else if (input.stock === "out-of-stock") conditions.push(Prisma.sql`${availableUnits} = 0`);
  const from = Prisma.sql`
    FROM "Product" p
    LEFT JOIN "Brand" b ON b."id" = p."brandId"
    LEFT JOIN "Category" c ON c."id" = p."categoryId"
    LEFT JOIN LATERAL (
      SELECT MIN(v."priceMinor") AS "minPrice"
      FROM "ProductVariant" v
      WHERE v."productId" = p."id" AND v."active" = TRUE
    ) priced ON TRUE
    LEFT JOIN LATERAL (
      SELECT COUNT(*)::int AS "variantCount",
        COALESCE(SUM(CASE WHEN v."active" THEN GREATEST(v."onHand" - v."reserved", 0) ELSE 0 END), 0)::bigint AS "available"
      FROM "ProductVariant" v WHERE v."productId" = p."id"
    ) sku_stock ON TRUE
    LEFT JOIN LATERAL (
      SELECT COALESCE(SUM(GREATEST(i."onHand" - i."reserved", 0)), 0)::bigint AS "available"
      FROM "InventoryItem" i WHERE i."productId" = p."id"
    ) warehouse_stock ON TRUE
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
