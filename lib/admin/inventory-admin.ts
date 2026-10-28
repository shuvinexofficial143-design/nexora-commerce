import { getPrisma } from "@/lib/db/prisma";
import { logAdmin } from "@/lib/admin/audit";

export class StockAdjustmentError extends Error {
  constructor(message: string) { super(message); this.name = "StockAdjustmentError"; }
}
export class StockAdjustmentConflict extends Error {
  constructor() { super("Stock changed. Refresh the inventory and retry."); this.name = "StockAdjustmentConflict"; }
}

export async function adjustStock(input: Record<string, unknown>, adminUserId?: string) {
  const id = typeof input.inventoryId === "string" ? input.inventoryId.trim() : "";
  const delta = input.delta;
  const note = typeof input.note === "string" ? input.note.trim() : "";

  if (!id || id.length > 128 || typeof delta !== "number" || !Number.isSafeInteger(delta) ||
      delta === 0 || Math.abs(delta) > 100000 || note.length < 3 || note.length > 500) {
    throw new StockAdjustmentError("Provide a valid inventory row, nonzero whole-number adjustment up to 100000, and a reason (3–500 characters).");
  }
  if (adminUserId !== undefined && (!adminUserId || adminUserId.length > 128)) {
    throw new Error("Invalid admin identity.");
  }

  return getPrisma().$transaction(async (tx) => {
    const row = await tx.inventoryItem.findUnique({ where: { id } });
    if (!row) throw new StockAdjustmentError("Inventory row not found.");

    const next = row.onHand + delta;
    if (!Number.isSafeInteger(next) || next > 2147483647 || next < 0 || next < row.reserved) {
      throw new StockAdjustmentError("Cannot reduce stock below reserved quantity or exceed stock limits.");
    }

    const changed = await tx.inventoryItem.updateMany({
      where: { id, onHand: row.onHand, reserved: row.reserved },
      data: { onHand: next },
    });
    if (changed.count !== 1) throw new StockAdjustmentConflict();
    const updated = await tx.inventoryItem.findUniqueOrThrow({ where: { id } });

    await tx.inventoryMovement.create({
      data: {
        warehouseId: row.warehouseId,
        productId: row.productId,
        type: "ADJUSTMENT",
        quantity: delta,
        reference: `ADMIN:${id}`,
        note,
      },
    });

    if (adminUserId) await logAdmin({
      adminUserId, action: "INVENTORY_ADJUSTMENT", entityType: "INVENTORY",
      entityId: updated.id, summary: "Inventory adjusted by " + delta, metadata: { note },
    }, tx);
    return updated;
  });
}
