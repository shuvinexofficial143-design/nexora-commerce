import type { Prisma } from "@/generated/prisma/client";

type ReconcileOrder = {
  id?: string;
  orderNumber: string;
  items: Array<{ productId: string; productVariantId?: string | null; quantity: number }>;
};

export async function reconcileOrder(
  tx: Prisma.TransactionClient,
  order: ReconcileOrder,
  mode: "DELIVER" | "CANCEL",
) {
  const oldMovement = await tx.inventoryMovement.findFirst({
    where: { reference: order.orderNumber, note: { startsWith: "ORDER_SETTLED:" } },
  });
  const variantSettled = await tx.productVariantMovement.findFirst({
    where: { reference: order.orderNumber, type: { in: ["OUTBOUND", "RELEASE"] } },
  });
  const baseDemand = new Map<string, number>();
  const variantDemand = new Map<string, number>();
  for (const item of order.items) {
    if (item.productVariantId) {
      variantDemand.set(item.productVariantId,
        (variantDemand.get(item.productVariantId) ?? 0) + item.quantity);
    } else {
      baseDemand.set(item.productId, (baseDemand.get(item.productId) ?? 0) + item.quantity);
    }
  }
  if (!oldMovement && baseDemand.size) {
    const reserves = await tx.inventoryMovement.findMany({
      where: { reference: order.orderNumber, type: "RESERVE" },
      orderBy: [{ productId: "asc" }, { createdAt: "asc" }, { id: "asc" }],
    });
    for (const [productId, demand] of [...baseDemand].sort(([a], [b]) => a.localeCompare(b))) {
      let left = demand;
      for (const movement of reserves.filter(row => row.productId === productId)) {
        if (!left) break;
        const quantity = Math.min(left, movement.quantity);
        const inventory = await tx.inventoryItem.findUnique({
          where: { productId_warehouseId: { productId, warehouseId: movement.warehouseId } },
        });
        if (!inventory || inventory.reserved < quantity ||
          (mode === "DELIVER" && inventory.onHand < quantity)) {
          throw new Error("Inventory reservation mismatch.");
        }
        const updated = await tx.inventoryItem.updateMany({
          where: { id: inventory.id, reserved: { gte: quantity },
            ...(mode === "DELIVER" ? { onHand: { gte: quantity } } : {}) },
          data: mode === "DELIVER"
            ? { reserved: { decrement: quantity }, onHand: { decrement: quantity } }
            : { reserved: { decrement: quantity } },
        });
        if (updated.count !== 1) throw new Error("Inventory changed during order settlement.");
        await tx.inventoryMovement.create({
          data: { warehouseId: movement.warehouseId, productId,
            type: mode === "DELIVER" ? "OUTBOUND" : "RELEASE",
            quantity, reference: order.orderNumber,
            note: "ORDER_SETTLED:" + mode + ":" + movement.id },
        });
        left -= quantity;
      }
      if (left) throw new Error("Reserved product stock could not be fully reconciled.");
    }
  }

  if (!variantSettled && variantDemand.size) {
    const reserves = await tx.productVariantMovement.findMany({
      where: { reference: order.orderNumber, type: "RESERVE" },
    });
    for (const [variantId, quantity] of [...variantDemand].sort(([a], [b]) => a.localeCompare(b))) {
      const sum = reserves.filter(row => row.variantId === variantId)
        .reduce((total, row) => total + row.quantity, 0);
      if (sum !== quantity) throw new Error("Variant reservation mismatch.");
      const updated = await tx.productVariant.updateMany({
        where: { id: variantId, reserved: { gte: quantity },
          ...(mode === "DELIVER" ? { onHand: { gte: quantity } } : {}) },
        data: mode === "DELIVER"
          ? { reserved: { decrement: quantity }, onHand: { decrement: quantity } }
          : { reserved: { decrement: quantity } },
      });
      if (updated.count !== 1) throw new Error("Variant stock changed during settlement.");
      await tx.productVariantMovement.create({
        data: { variantId, orderId: order.id, type: mode === "DELIVER" ? "OUTBOUND" : "RELEASE",
          quantity, reference: order.orderNumber, note: "ORDER_SETTLED:" + mode },
      });
    }
  }
}
