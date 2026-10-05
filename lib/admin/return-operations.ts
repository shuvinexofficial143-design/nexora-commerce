import { getPrisma } from "@/lib/db/prisma";

type ReturnOperationRow = {
  id: string;
  orderId: string;
  orderNumber: string;
  restockedAt: Date | null;
  refundProcessedAt: Date | null;
};

export async function processReturn(input: {
  returnId: string;
  status: string;
  refundMinor: number;
  note: string;
  restock: boolean;
}) {
  const p = getPrisma();

  return p.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<ReturnOperationRow[]>`
      select r.*,o."orderNumber"
      from "ReturnRequest" r
      join "Order" o on o."id"=r."orderId"
      where r."id"=${input.returnId}
      limit 1
    `;

    const row = rows[0];
    if (!row) throw new Error("Return not found.");

    if (input.restock && !row.restockedAt) {
      const items = await tx.orderItem.findMany({ where: { orderId: row.orderId } });

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
        update "ReturnRequest" set "restockedAt"=now() where "id"=${row.id}
      `;
    }

    if (input.refundMinor > 0 && !row.refundProcessedAt) {
      await tx.order.update({
        where: { id: row.orderId },
        data: { paymentStatus: "REFUNDED", status: "REFUNDED" },
      });
      await tx.$executeRaw`
        update "ReturnRequest" set "refundProcessedAt"=now() where "id"=${row.id}
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
      orderId: row.orderId,
      orderNumber: row.orderNumber,
      status: input.status,
      refundMinor: input.refundMinor,
    };
  });
}
