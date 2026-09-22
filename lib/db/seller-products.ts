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

  await prisma.$executeRawUnsafe(`
    alter table "SellerProduct" enable row level security
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


async function requireOwnedProduct(userId: string, productId: string) {
  await ensureSellerProductTable();
  const sellerProfileId = await getSellerProfileId(userId);
  if (!sellerProfileId) {
    throw new ValidationError("Seller profile not found.");
  }

  const rows = await getPrisma().$queryRaw<Array<{ id: string }>>`
    select p."id"
    from "SellerProduct" sp
    join "Product" p on p."id"=sp."productId"
    where sp."sellerProfileId"=${sellerProfileId}
      and p."id"=${productId}
    limit 1
  `;

  if (!rows[0]) {
    throw new ValidationError("Product does not belong to this seller.");
  }

  return sellerProfileId;
}

export async function updateSellerProduct(
  userId: string,
  productId: string,
  input: {
    name?: string;
    price?: number;
    status?: "Live" | "Draft" | "Paused";
  },
) {
  await requireOwnedProduct(userId, productId);

  const data: {
    name?: string;
    priceMinor?: number;
    status?: "ACTIVE" | "DRAFT" | "ARCHIVED";
  } = {};

  if (typeof input.name === "string") {
    const name = input.name.trim();
    if (name.length < 2) throw new ValidationError("Product name is required.");
    data.name = name;
  }

  if (typeof input.price === "number") {
    if (!Number.isFinite(input.price) || input.price <= 0) {
      throw new ValidationError("Enter a valid product price.");
    }
    data.priceMinor = Math.round(input.price * 100);
  }

  if (input.status) {
    if (input.status === "Live") {
      const stockRows = await getPrisma().$queryRaw<Array<{ available: bigint | number }>>`
        select coalesce(sum(greatest("onHand"-"reserved",0)),0)::bigint as "available"
        from "InventoryItem"
        where "productId"=${productId}
      `;
      if (Number(stockRows[0]?.available ?? 0) <= 0) {
        throw new ValidationError("Add stock before publishing this product.");
      }
      data.status = "ACTIVE";
    } else {
      data.status = input.status === "Paused" ? "ARCHIVED" : "DRAFT";
    }
  }

  if (!Object.keys(data).length) {
    throw new ValidationError("No product changes were provided.");
  }

  const product = await getPrisma().product.update({
    where: { id: productId },
    data,
  });

  return {
    id: product.id,
    name: product.name,
    price: product.priceMinor / 100,
    status: mapStatus(product.status),
  };
}

export async function adjustSellerProductStock(
  userId: string,
  productId: string,
  delta: number,
) {
  await requireOwnedProduct(userId, productId);

  if (!Number.isInteger(delta) || delta === 0 || Math.abs(delta) > 100000) {
    throw new ValidationError("Stock adjustment must be a non-zero whole number.");
  }

  const prisma = getPrisma();

  return prisma.$transaction(async (tx) => {
    const inventory = await tx.inventoryItem.findMany({
      where: { productId },
      include: { warehouse: true },
      orderBy: { updatedAt: "asc" },
    });

    if (delta > 0) {
      let row = inventory.find((item) => item.warehouse.active) ?? inventory[0];

      if (!row) {
        const warehouse = await tx.warehouse.findFirst({
          where: { active: true },
          orderBy: { createdAt: "asc" },
        });

        if (!warehouse) {
          throw new ValidationError("No active warehouse is available for stock.");
        }

        row = await tx.inventoryItem.create({
          data: {
            productId,
            warehouseId: warehouse.id,
            onHand: 0,
            reserved: 0,
            reorderLevel: 5,
          },
          include: { warehouse: true },
        });
      }

      await tx.inventoryItem.update({
        where: { id: row.id },
        data: { onHand: { increment: delta } },
      });

      await tx.inventoryMovement.create({
        data: {
          warehouseId: row.warehouseId,
          productId,
          type: "ADJUSTMENT",
          quantity: delta,
          reference: `SELLER:${userId}`,
          note: "SELLER_STOCK_ADJUSTMENT",
        },
      });
    } else {
      let left = Math.abs(delta);
      const rows = [...inventory].sort(
        (a, b) => b.onHand - b.reserved - (a.onHand - a.reserved),
      );

      const totalAvailable = rows.reduce(
        (sum, row) => sum + Math.max(0, row.onHand - row.reserved),
        0,
      );

      if (totalAvailable < left) {
        throw new ValidationError("Cannot reduce stock below reserved quantity.");
      }

      for (const row of rows) {
        if (left <= 0) break;
        const available = Math.max(0, row.onHand - row.reserved);
        const quantity = Math.min(left, available);
        if (!quantity) continue;

        await tx.inventoryItem.update({
          where: { id: row.id },
          data: { onHand: { decrement: quantity } },
        });

        await tx.inventoryMovement.create({
          data: {
            warehouseId: row.warehouseId,
            productId,
            type: "ADJUSTMENT",
            quantity: -quantity,
            reference: `SELLER:${userId}`,
            note: "SELLER_STOCK_ADJUSTMENT",
          },
        });

        left -= quantity;
      }
    }

    const totals = await tx.inventoryItem.aggregate({
      where: { productId },
      _sum: { onHand: true, reserved: true },
    });

    const onHand = totals._sum.onHand ?? 0;
    const reserved = totals._sum.reserved ?? 0;

    return {
      productId,
      onHand,
      reserved,
      available: Math.max(0, onHand - reserved),
    };
  });
}
