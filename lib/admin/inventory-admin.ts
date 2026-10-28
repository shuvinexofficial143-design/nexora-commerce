import { getPrisma } from "@/lib/db/prisma";
import { logAdmin } from "@/lib/admin/audit";

export class StockAdjustmentError extends Error {
  constructor(message: string) { super(message); this.name = "StockAdjustmentError"; }
}
export class StockAdjustmentConflict extends Error {
  constructor() {
    super("Cannot reduce stock below reserved quantity or adjust invalid stock. Refresh and retry.");
    this.name = "StockAdjustmentConflict";
  }
}

/** Change warehouse stock without racing a simultaneous checkout reservation.
 * The conditional UPDATE is the sole authority; a prior SELECT is not a lock. */
export async function adjustStock(input: Record<string, unknown>, adminUserId?: string) {
  const id = typeof input.inventoryId === "string" ? input.inventoryId.trim() : "";
  const delta = input.delta;
  const note = typeof input.note === "string" ? input.note.trim() : "";

  if (!id || id.length > 128 || typeof delta !== "number" || !Number.isSafeInteger(delta) || delta === 0 ||
      Math.abs(delta) > 100_000 || note.length < 3 || note.length > 500) {
    throw new StockAdjustmentError("A bounded stock adjustment and reason are required.");
  }
  if (adminUserId !== undefined && (!adminUserId.trim() || adminUserId.length > 128)) {
    throw new StockAdjustmentError("Invalid admin identity.");
  }

  return getPrisma().$transaction(async (tx) => {
    // Row locks serialize this UPDATE with checkout's guarded stock reservation.
    // Compute from the current onHand value rather than an old read snapshot.
    const updatedCount = await tx.$executeRaw`
      UPDATE "InventoryItem"
      SET "onHand" = "onHand" + ${delta}, "updatedAt" = NOW()
      WHERE "id" = ${id}
        AND "onHand" >= 0 AND "reserved" >= 0
        AND ("onHand"::bigint + ${delta}) BETWEEN "reserved" AND 2147483647
    `;
    if (updatedCount !== 1) {
      const existing = await tx.inventoryItem.findUnique({ where: { id }, select: { id: true } });
      if (!existing) throw new StockAdjustmentError("Inventory row not found.");
      throw new StockAdjustmentConflict();
    }
    const updated = await tx.inventoryItem.findUniqueOrThrow({ where: { id } });
    await tx.inventoryMovement.create({
      data: {
        warehouseId: updated.warehouseId,
        productId: updated.productId,
        type: "ADJUSTMENT",
        quantity: delta,
        reference: `ADMIN:${id}`,
        note,
      },
    });
    if (adminUserId) {
      await logAdmin({
        adminUserId, action: "INVENTORY_ADJUSTMENT", entityType: "INVENTORY",
        entityId: updated.id, summary: "Inventory adjusted by " + delta,
        metadata: { note },
      }, tx);
    }
    return updated;
  });
}
