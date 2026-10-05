import { getPrisma } from "@/lib/db/prisma";

export type ReturnOperationRow = {
  id: string;
  orderId: string;
  orderNumber: string;
  returnStatus: string | null;
  refundMinor: number | null;
  restockedAt: Date | null;
  refundProcessedAt: Date | null;
  paymentMethod: string | null;
  paymentStatus: string;
  orderStatus: string;
  totalMinor: number;
};

export async function getReturnOperation(returnId: string) {
  const rows = await getPrisma().$queryRaw<ReturnOperationRow[]>`
    select
      r."id",
      r."orderId",
      o."orderNumber",
      r."status" as "returnStatus",
      r."refundMinor",
      r."restockedAt",
      r."refundProcessedAt",
      o."paymentMethod",
      o."paymentStatus"::text as "paymentStatus",
      o."status"::text as "orderStatus",
      o."totalMinor"
    from "ReturnRequest" r
    join "Order" o on o."id"=r."orderId"
    where r."id"=${returnId}
    limit 1
  `;

  return rows[0] ?? null;
}

export async function processReturn(input: {
  returnId: string;
  status: string;
  refundMinor: number;
  note: string;
  restock: boolean;
}) {
  const prisma = getPrisma();

  return prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<ReturnOperationRow[]>`
      select
        r."id",
        r."orderId",
        o."orderNumber",
        r."status" as "returnStatus",
        r."refundMinor",
        r."restockedAt",
        r."refundProcessedAt",
        o."paymentMethod",
        o."paymentStatus"::text as "paymentStatus",
        o."status"::text as "orderStatus",
        o."totalMinor"
      from "ReturnRequest" r
      join "Order" o on o."id"=r."orderId"
      where r."id"=${input.returnId}
      limit 1
      for update
    `;

    const row = rows[0];
    if (!row) throw new Error("Return not found.");

    if (input.refundMinor < 0 || input.refundMinor > row.totalMinor) {
      throw new Error("Refund amount exceeds the order total.");
    }

    if (input.restock && !row.restockedAt) {
      const items = await tx.orderItem.findMany({
        where: { orderId: row.orderId },
      });

      for (const item of items) {
        const stock = await tx.inventoryItem.findFirst({
          where: { productId: item.productId },
          orderBy: { onHand: "desc" },
        });
        if (!stock) continue;

        await tx.inventoryItem.update({
          where: { id: stock.id },
          data: { onHand: { increment: item.quantity } },
        });
        await tx.inventoryMovement.create({
          data: {
            warehouseId: stock.warehouseId,
            productId: item.productId,
            type: "INBOUND",
            quantity: item.quantity,
            reference: row.orderNumber,
            note: `RETURN_RESTOCK:${row.id}`,
          },
        });
      }

      await tx.$executeRaw`
        update "ReturnRequest"
        set "restockedAt"=now()
        where "id"=${row.id}
      `;
    }

    await tx.$executeRaw`
      update "ReturnRequest"
      set "status"=${input.status},
          "refundMinor"=${input.refundMinor},
          "resolutionNote"=${input.note},
          "updatedAt"=now()
      where "id"=${row.id}
    `;

    return {
      updated: true,
      ...row,
      returnStatus: input.status,
      refundMinor: input.refundMinor,
    };
  });
}

export async function finalizeReturnRefund(input: {
  returnId: string;
  orderId: string;
  refundMinor: number;
  totalMinor: number;
}) {
  const prisma = getPrisma();

  return prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<
      Array<{ refundProcessedAt: Date | null }>
    >`
      select "refundProcessedAt"
      from "ReturnRequest"
      where "id"=${input.returnId}
      limit 1
      for update
    `;

    const row = rows[0];
    if (!row) throw new Error("Return not found.");

    if (row.refundProcessedAt) {
      return {
        finalized: true,
        alreadyProcessed: true,
        refundProcessedAt: row.refundProcessedAt,
      };
    }

    const fullRefund = input.refundMinor >= input.totalMinor;

    await tx.order.update({
      where: { id: input.orderId },
      data: {
        paymentStatus: fullRefund ? "REFUNDED" : "PARTIALLY_REFUNDED",
        status: fullRefund ? "REFUNDED" : "RETURNED",
      },
    });

    const processedAt = new Date();
    await tx.$executeRaw`
      update "ReturnRequest"
      set "refundProcessedAt"=${processedAt},
          "updatedAt"=now()
      where "id"=${input.returnId}
    `;

    return {
      finalized: true,
      alreadyProcessed: false,
      refundProcessedAt: processedAt,
      fullRefund,
    };
  });
}
