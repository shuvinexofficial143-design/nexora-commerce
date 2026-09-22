import { randomUUID } from "node:crypto";
import { getPrisma } from "@/lib/db/prisma";
import { ValidationError } from "@/lib/db/errors";
import type { SellerProduct } from "@/types/seller";

type SellerProductRow = {
  id: string;
  slug: string;
  sku: string;
  name: string;
  category: string | null;
  priceMinor: number;
  stock: bigint | number;
  sold: bigint | number;
  rating: number;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
};

function mapStatus(status: SellerProductRow["status"]): SellerProduct["status"] {
  if (status === "ACTIVE") return "Live";
  if (status === "ARCHIVED") return "Paused";
  return "Draft";
}

function mapRow(row: SellerProductRow): SellerProduct {
  return {
    id: row.id,
    slug: row.slug,
    sku: row.sku,
    name: row.name,
    category: row.category ?? "Uncategorized",
    price: row.priceMinor / 100,
    stock: Number(row.stock),
    sold: Number(row.sold),
    rating: row.rating,
    status: mapStatus(row.status),
  };
}

async function ensureSellerProductTable() {
  const prisma = getPrisma();

  await prisma.$executeRawUnsafe(`
    create table if not exists "SellerProduct" (
      "id" text primary key,
      "sellerProfileId" text not null references "SellerProfile"("id") on delete cascade,
      "productId" text not null references "Product"("id") on delete cascade,
      "createdAt" timestamp(3) not null default current_timestamp,
      constraint "SellerProduct_productId_key" unique ("productId"),
      constraint "SellerProduct_sellerProfileId_productId_key" unique ("sellerProfileId","productId")
    )
  `);

  await prisma.$executeRawUnsafe(`
    create index if not exists "SellerProduct_sellerProfileId_idx"
    on "SellerProduct"("sellerProfileId")
  `);
}

async function getSellerProfileId(userId: string) {
  const rows = await getPrisma().$queryRaw<Array<{ id: string }>>`
    select "id" from "SellerProfile" where "userId"=${userId} limit 1
  `;
  return rows[0]?.id ?? null;
}

export async function listSellerProducts(userId: string) {
  await ensureSellerProductTable();
  const sellerProfileId = await getSellerProfileId(userId);
  if (!sellerProfileId) return [];

  const rows = await getPrisma().$queryRaw<SellerProductRow[]>`
    select
      p."id",
      p."slug",
      p."sku",
      p."name",
      c."name" as "category",
      p."priceMinor",
      coalesce(sum(greatest(i."onHand" - i."reserved", 0)), 0)::bigint as "stock",
      coalesce(sold."quantity", 0)::bigint as "sold",
      p."rating",
      p."status"
    from "SellerProduct" sp
    join "Product" p on p."id"=sp."productId"
    left join "Category" c on c."id"=p."categoryId"
    left join "InventoryItem" i on i."productId"=p."id"
    left join (
      select "productId", sum("quantity")::bigint as "quantity"
      from "OrderItem"
      group by "productId"
    ) sold on sold."productId"=p."id"
    where sp."sellerProfileId"=${sellerProfileId}
    group by p."id",p."slug",p."sku",p."name",c."name",p."priceMinor",sold."quantity",p."rating",p."status",p."createdAt"
    order by p."createdAt" desc
  `;

  return rows.map(mapRow);
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function createSellerProduct(
  userId: string,
  input: {
    name: string;
    sku: string;
    price: number;
    description: string;
  },
) {
  await ensureSellerProductTable();

  const sellerProfileId = await getSellerProfileId(userId);
  if (!sellerProfileId) {
    throw new ValidationError("Complete and save your seller profile before adding products.");
  }

  const name = input.name.trim();
  const sku = input.sku.trim().toUpperCase();
  const description = input.description.trim();
  const price = input.price;

  if (name.length < 2) throw new ValidationError("Product name is required.");
  if (sku.length < 3) throw new ValidationError("SKU must be at least 3 characters.");
  if (!Number.isFinite(price) || price <= 0) {
    throw new ValidationError("Enter a valid product price.");
  }
  if (description.length < 10) {
    throw new ValidationError("Description must be at least 10 characters.");
  }

  const prisma = getPrisma();

  return prisma.$transaction(async (tx) => {
    const product = await tx.product.create({
      data: {
        slug: `${slugify(name)}-${randomUUID().slice(0, 6)}`,
        sku,
        name,
        description,
        priceMinor: Math.round(price * 100),
        status: "DRAFT",
      },
    });

    await tx.$executeRaw`
      insert into "SellerProduct"("id","sellerProfileId","productId","createdAt")
      values(${randomUUID()},${sellerProfileId},${product.id},now())
    `;

    return {
      id: product.id,
      slug: product.slug,
      sku: product.sku,
      status: "Draft" as const,
    };
  });
}
