import { getPrisma } from "@/lib/db/prisma";
import type {
  SellerInventory,
  SellerOrder,
  SellerOrderStatus,
} from "@/types/seller";

type SellerProfileIdRow = { id: string };

type SellerOrderRow = {
  orderNumber: string;
  customer: string;
  product: string;
  quantity: bigint | number;
  amountMinor: bigint | number;
  createdAt: Date;
  status: string;
};

type SellerInventoryRow = {
  sku: string;
  product: string;
  onHand: bigint | number;
  reserved: bigint | number;
  available: bigint | number;
  reorderAt: bigint | number;
};

type SellerEarningsRow = {
  grossMinor: bigint | number;
  adjustmentsMinor: bigint | number;
};

type SellerSalesDayRow = {
  day: Date;
  salesMinor: bigint | number;
  orders: bigint | number;
};

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

async function getSellerProfile(userId: string) {
  await ensureSellerProductTable();
  const rows = await getPrisma().$queryRaw<Array<SellerProfileIdRow & { commissionBps: number }>>`
    select "id","commissionBps"
    from "SellerProfile"
    where "userId"=${userId}
    limit 1
  `;

  return rows[0] ?? null;
}

function mapOrderStatus(status: string): SellerOrderStatus {
  if (status === "PROCESSING") return "Processing";
  if (status === "PACKED") return "Packed";
  if (status === "SHIPPED" || status === "OUT_FOR_DELIVERY") return "Shipped";
  if (status === "DELIVERED") return "Delivered";
  if (status === "RETURNED") return "Returned";
  if (status === "REFUNDED") return "Refunded";
  if (status === "CANCELLED") return "Cancelled";
  return "New";
}

function formatPlaced(date: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export async function listSellerOrders(userId: string): Promise<SellerOrder[]> {
  const seller = await getSellerProfile(userId);
  if (!seller) return [];

  const rows = await getPrisma().$queryRaw<SellerOrderRow[]>`
    select
      o."orderNumber",
      u."name" as "customer",
      string_agg(oi."productName", ', ' order by oi."productName") as "product",
      sum(oi."quantity")::bigint as "quantity",
      sum(oi."totalMinor")::bigint as "amountMinor",
      o."createdAt",
      o."status"::text as "status"
    from "SellerProduct" sp
    join "OrderItem" oi on oi."productId"=sp."productId"
    join "Order" o on o."id"=oi."orderId"
    join "User" u on u."id"=o."userId"
    where sp."sellerProfileId"=${seller.id}
    group by o."id",o."orderNumber",u."name",o."createdAt",o."status"
    order by o."createdAt" desc
    limit 100
  `;

  return rows.map((row) => ({
    id: row.orderNumber,
    customer: row.customer,
    product: row.product,
    quantity: Number(row.quantity),
    amount: Number(row.amountMinor) / 100,
    placed: formatPlaced(row.createdAt),
    status: mapOrderStatus(row.status),
  }));
}

function inventoryStatus(available: number, reorderAt: number): SellerInventory["status"] {
  if (available <= 0) return "Out";
  if (available <= Math.max(1, Math.floor(reorderAt / 2))) return "Critical";
  if (available <= reorderAt) return "Low";
  return "Healthy";
}

export async function listSellerInventory(userId: string): Promise<SellerInventory[]> {
  const seller = await getSellerProfile(userId);
  if (!seller) return [];

  const rows = await getPrisma().$queryRaw<SellerInventoryRow[]>`
    select
      p."sku",
      p."name" as "product",
      coalesce(sum(i."onHand"),0)::bigint as "onHand",
      coalesce(sum(i."reserved"),0)::bigint as "reserved",
      coalesce(sum(greatest(i."onHand"-i."reserved",0)),0)::bigint as "available",
      coalesce(sum(i."reorderLevel"),5)::bigint as "reorderAt"
    from "SellerProduct" sp
    join "Product" p on p."id"=sp."productId"
    left join "InventoryItem" i on i."productId"=p."id"
    where sp."sellerProfileId"=${seller.id}
    group by p."id",p."sku",p."name",p."createdAt"
    order by p."createdAt" desc
  `;

  return rows.map((row) => {
    const onHand = Number(row.onHand);
    const reserved = Number(row.reserved);
    const available = Number(row.available);
    const reorderAt = Number(row.reorderAt);

    return {
      sku: row.sku,
      product: row.product,
      onHand,
      reserved,
      available,
      reorderAt,
      status: inventoryStatus(available, reorderAt),
    };
  });
}

export async function getSellerEarnings(userId: string) {
  const seller = await getSellerProfile(userId);
  if (!seller) {
    return {
      grossMinor: 0,
      commissionMinor: 0,
      adjustmentsMinor: 0,
      netMinor: 0,
      commissionBps: 1000,
      salesSeries: [] as Array<{ day: string; sales: number; orders: number }>,
    };
  }

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const [summaryRows, seriesRows] = await Promise.all([
    getPrisma().$queryRaw<SellerEarningsRow[]>`
      select
        coalesce(sum(
          case
            when o."status" not in ('CANCELLED','RETURNED','REFUNDED')
            then oi."totalMinor"
            else 0
          end
        ),0)::bigint as "grossMinor",
        coalesce(sum(
          case
            when o."status" in ('RETURNED','REFUNDED')
            then oi."totalMinor"
            else 0
          end
        ),0)::bigint as "adjustmentsMinor"
      from "SellerProduct" sp
      join "OrderItem" oi on oi."productId"=sp."productId"
      join "Order" o on o."id"=oi."orderId"
      where sp."sellerProfileId"=${seller.id}
        and o."createdAt">=${monthStart}
    `,
    getPrisma().$queryRaw<SellerSalesDayRow[]>`
      select
        date_trunc('day',o."createdAt") as "day",
        coalesce(sum(oi."totalMinor"),0)::bigint as "salesMinor",
        count(distinct o."id")::bigint as "orders"
      from "SellerProduct" sp
      join "OrderItem" oi on oi."productId"=sp."productId"
      join "Order" o on o."id"=oi."orderId"
      where sp."sellerProfileId"=${seller.id}
        and o."createdAt">=${sevenDaysAgo}
        and o."status" not in ('CANCELLED','RETURNED','REFUNDED')
      group by date_trunc('day',o."createdAt")
      order by "day" asc
    `,
  ]);

  const summary = summaryRows[0] ?? { grossMinor: 0, adjustmentsMinor: 0 };
  const grossMinor = Number(summary.grossMinor);
  const adjustmentsMinor = Number(summary.adjustmentsMinor);
  const commissionMinor = Math.round(grossMinor * (seller.commissionBps / 10000));
  const netMinor = Math.max(0, grossMinor - commissionMinor);

  const byDay = new Map(
    seriesRows.map((row) => [
      row.day.toISOString().slice(0, 10),
      {
        sales: Number(row.salesMinor) / 100,
        orders: Number(row.orders),
      },
    ]),
  );

  const salesSeries = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(sevenDaysAgo);
    day.setDate(sevenDaysAgo.getDate() + index);
    const key = day.toISOString().slice(0, 10);
    const value = byDay.get(key) ?? { sales: 0, orders: 0 };

    return {
      day: new Intl.DateTimeFormat("en-IN", { weekday: "short" }).format(day),
      sales: value.sales,
      orders: value.orders,
    };
  });

  return {
    grossMinor,
    commissionMinor,
    adjustmentsMinor,
    netMinor,
    commissionBps: seller.commissionBps,
    salesSeries,
  };
}


type SellerTopProductRow = {
  name: string;
  units: bigint | number;
  revenueMinor: bigint | number;
};

type SellerStatusRow = {
  status: string;
  orders: bigint | number;
};

export async function getSellerAnalytics(userId: string) {
  const seller = await getSellerProfile(userId);
  if (!seller) {
    return {
      topProducts: [] as Array<{ name: string; units: number; revenue: number }>,
      orderStatuses: [] as Array<{ label: string; count: number }>,
    };
  }

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [topRows, statusRows] = await Promise.all([
    getPrisma().$queryRaw<SellerTopProductRow[]>`
      select
        oi."productName" as "name",
        sum(oi."quantity")::bigint as "units",
        sum(oi."totalMinor")::bigint as "revenueMinor"
      from "SellerProduct" sp
      join "OrderItem" oi on oi."productId"=sp."productId"
      join "Order" o on o."id"=oi."orderId"
      where sp."sellerProfileId"=${seller.id}
        and o."createdAt">=${monthStart}
        and o."status" not in ('CANCELLED','RETURNED','REFUNDED')
      group by oi."productId",oi."productName"
      order by "revenueMinor" desc
      limit 5
    `,
    getPrisma().$queryRaw<SellerStatusRow[]>`
      select
        o."status"::text as "status",
        count(distinct o."id")::bigint as "orders"
      from "SellerProduct" sp
      join "OrderItem" oi on oi."productId"=sp."productId"
      join "Order" o on o."id"=oi."orderId"
      where sp."sellerProfileId"=${seller.id}
        and o."createdAt">=${monthStart}
      group by o."status"
    `,
  ]);

  const statusMap = new Map<string, number>();
  for (const row of statusRows) {
    const label = mapOrderStatus(row.status);
    statusMap.set(label, (statusMap.get(label) ?? 0) + Number(row.orders));
  }

  return {
    topProducts: topRows.map((row) => ({
      name: row.name,
      units: Number(row.units),
      revenue: Number(row.revenueMinor) / 100,
    })),
    orderStatuses: [...statusMap.entries()]
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count),
  };
}
