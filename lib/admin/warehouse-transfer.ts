import { randomUUID } from "node:crypto";
import { getPrisma } from "@/lib/db/prisma";
import { logAdmin } from "@/lib/admin/audit";

export class WarehouseTransferValidationError extends Error {
  constructor(message: string) { super(message); this.name = "WarehouseTransferValidationError"; }
}
export class WarehouseTransferConflict extends Error {
  constructor(message = "Warehouse stock changed. Refresh balances and retry.") {
    super(message);
    this.name = "WarehouseTransferConflict";
  }
}

export async function transferStock(adminUserId: string, input: Record<string, unknown>) {
  const from = typeof input.fromWarehouseId === "string" ? input.fromWarehouseId.trim() : "";
  const to = typeof input.toWarehouseId === "string" ? input.toWarehouseId.trim() : "";
  const productId = typeof input.productId === "string" ? input.productId.trim() : "";
  const quantity = input.quantity;
  const note = typeof input.note === "string" ? input.note.trim() : "";
  if (!adminUserId || adminUserId.length > 128) throw new Error("Invalid admin identity.");
  if (!from || !to || from === to || from.length > 128 || to.length > 128 ||
      !productId || productId.length > 128 ||
      typeof quantity !== "number" || !Number.isSafeInteger(quantity) || quantity <= 0 || quantity > 100000 ||
      note.length > 500) {
    throw new WarehouseTransferValidationError("Select two different warehouses, a product, and an integer quantity of 1–100000.");
  }

  return getPrisma().$transaction(async tx => {
    const active = await tx.warehouse.findMany({
      where: { id: { in: [from, to] }, active: true }, select: { id: true },
    });
    if (active.length !== 2) throw new WarehouseTransferValidationError("Both warehouses must be active.");

    const source = await tx.inventoryItem.findUnique({
      where: { productId_warehouseId: { productId, warehouseId: from } },
    });
    if (!source || source.onHand - source.reserved < quantity) {
      throw new WarehouseTransferConflict("Not enough unreserved source stock.");
    }

    // Upsert prevents a missing destination row from being created twice.
    const destination = await tx.inventoryItem.upsert({
      where: { productId_warehouseId: { productId, warehouseId: to } },
      create: { id: randomUUID(), productId, warehouseId: to, onHand: 0, reserved: 0, reorderLevel: 5 },
      update: {},
    });
    if (destination.onHand > 2147483647 - quantity) {
      throw new WarehouseTransferValidationError("Destination stock exceeds supported inventory limits.");
    }

    // Compare-and-swap prevents a concurrent Owner/checkout/adjustment from
    // silently taking stock reserved by another transaction.
    const debited = await tx.inventoryItem.updateMany({
      where: { id: source.id, onHand: source.onHand, reserved: source.reserved },
      data: { onHand: { decrement: quantity } },
    });
    if (debited.count !== 1) throw new WarehouseTransferConflict();
    const credited = await tx.inventoryItem.updateMany({
      where: { id: destination.id, onHand: destination.onHand, reserved: destination.reserved },
      data: { onHand: { increment: quantity } },
    });
    if (credited.count !== 1) throw new WarehouseTransferConflict();

    const id = randomUUID();
    const completedStatus = "COMPLETED";
    await tx.$executeRaw`
      INSERT INTO "WarehouseTransfer"
        ("id","fromWarehouseId","toWarehouseId","status","note","createdByUserId","createdAt")
      VALUES (${id},${from},${to},${completedStatus},${note || null},${adminUserId},now())
    `;
    await tx.$executeRaw`
      INSERT INTO "WarehouseTransferItem" ("id","transferId","productId","quantity")
      VALUES (${randomUUID()},${id},${productId},${quantity})
    `;
    await tx.inventoryMovement.createMany({ data: [
      { warehouseId: from, productId, type: "TRANSFER", quantity: -quantity, reference: id, note: "Transfer outbound" },
      { warehouseId: to, productId, type: "TRANSFER", quantity, reference: id, note: "Transfer inbound" },
    ] });

    await logAdmin({
      adminUserId, action: "WAREHOUSE_TRANSFER", entityType: "TRANSFER",
      entityId: id, summary: "Warehouse transfer " + id,
      metadata: { fromWarehouseId: from, toWarehouseId: to, productId, quantity },
    }, tx);
    return { id };
  }, { maxWait: 5000, timeout: 15000 });
}
