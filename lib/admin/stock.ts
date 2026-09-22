import type { Prisma } from "@/generated/prisma/client";

type ReconcileOrder = {
  orderNumber: string;
  items: Array<{ productId: string; quantity: number }>;
};

export async function reconcileOrder(
  tx: Prisma.TransactionClient,
  order: ReconcileOrder,
  mode: "DELIVER" | "CANCEL",
) {
  const already = await tx.inventoryMovement.findFirst({
    where: {
      reference: order.orderNumber,
      note: { startsWith: "ORDER_SETTLED:" },
    },
  });
  if (already) return;

  const reserves = await tx.inventoryMovement.findMany({
    where: { reference: order.orderNumber, type: "RESERVE" },
    orderBy: { createdAt: "asc" },
  });

  for (const item of order.items) {
    let left = item.quantity;

    for (const movement of reserves.filter((row) => row.productId === item.productId)) {
      if (left <= 0) break;

      const quantity = Math.min(left, movement.quantity);
      const inventory = await tx.inventoryItem.findUnique({
        where: {
          productId_warehouseId: {
            productId: item.productId,
            warehouseId: movement.warehouseId,
          },
        },
      });

      if (
        !inventory ||
        inventory.reserved < quantity ||
        (mode === "DELIVER" && inventory.onHand < quantity)
      ) {
        throw new Error("Inventory reservation mismatch.");
      }

      await tx.inventoryItem.update({
        where: { id: inventory.id },
        data:
          mode === "DELIVER"
            ? {
                reserved: { decrement: quantity },
                onHand: { decrement: quantity },
              }
            : { reserved: { decrement: quantity } },
      });

      await tx.inventoryMovement.create({
        data: {
          warehouseId: movement.warehouseId,
          productId: item.productId,
          type: mode === "DELIVER" ? "OUTBOUND" : "RELEASE",
          quantity,
          reference: order.orderNumber,
          note: `ORDER_SETTLED:${mode}:${movement.id}`,
        },
      });

      left -= quantity;
    }

    if (left > 0) {
      throw new Error("Reserved stock could not be fully reconciled.");
    }
  }
}
