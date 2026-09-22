import { getPrisma } from "@/lib/db/prisma";

export async function adjustStock(input: Record<string, unknown>) {
  const id = String(input.inventoryId ?? "");
  const delta = Number(input.delta);
  const note = String(input.note ?? "").trim();

  if (!Number.isInteger(delta) || !delta || note.length < 3) {
    throw new Error("Adjustment and reason are required.");
  }

  return getPrisma().$transaction(async (tx) => {
    const row = await tx.inventoryItem.findUnique({ where: { id } });
    if (!row) throw new Error("Inventory row not found.");

    const next = row.onHand + delta;
    if (next < 0 || next < row.reserved) {
      throw new Error("Cannot reduce stock below reserved quantity.");
    }

    const updated = await tx.inventoryItem.update({
      where: { id },
      data: { onHand: next },
    });

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

    return updated;
  });
}
