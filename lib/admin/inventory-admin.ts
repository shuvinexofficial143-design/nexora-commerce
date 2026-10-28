import { getPrisma } from "@/lib/db/prisma";

/** Change warehouse stock without racing a simultaneous checkout reservation.
 * The conditional UPDATE is the sole authority; a prior SELECT is not a lock. */
export async function adjustStock(input: Record<string, unknown>) {
  const id = String(input.inventoryId ?? "").trim();
  const delta = Number(input.delta);
  const note = String(input.note ?? "").trim();

  if (!id || !Number.isSafeInteger(delta) || delta === 0 ||
      Math.abs(delta) > 1_000_000 || note.length < 3 || note.length > 500) {
    throw new Error("A bounded stock adjustment and reason are required.");
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
      if (!existing) throw new Error("Inventory row not found.");
      throw new Error("Cannot reduce stock below reserved quantity or adjust invalid stock.");
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
    return updated;
  });
}
