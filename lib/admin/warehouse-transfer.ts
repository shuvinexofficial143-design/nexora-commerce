import { randomUUID } from "node:crypto";
import { getPrisma } from "@/lib/db/prisma";

export async function transferStock(
  adminUserId: string,
  input: Record<string, unknown>,
) {
  const from = String(input.fromWarehouseId ?? "");
  const to = String(input.toWarehouseId ?? "");
  const productId = String(input.productId ?? "");
  const quantity = Number(input.quantity);

  if (from === to || !Number.isInteger(quantity) || quantity <= 0) {
    throw new Error("Invalid warehouse transfer.");
  }

  return getPrisma().$transaction(async (tx) => {
    const source = await tx.inventoryItem.findUnique({
      where: { productId_warehouseId: { productId, warehouseId: from } },
    });

    if (!source || source.onHand - source.reserved < quantity) {
      throw new Error("Not enough available source stock.");
    }

    let destination = await tx.inventoryItem.findUnique({
      where: { productId_warehouseId: { productId, warehouseId: to } },
    });

    if (!destination) {
      destination = await tx.inventoryItem.create({
        data: {
          id: randomUUID(),
          productId,
          warehouseId: to,
          onHand: 0,
          reserved: 0,
          reorderLevel: 5,
        },
      });
    }

    await tx.inventoryItem.update({
      where: { id: source.id },
      data: { onHand: { decrement: quantity } },
    });
    await tx.inventoryItem.update({
      where: { id: destination.id },
      data: { onHand: { increment: quantity } },
    });

    const id = randomUUID();
    await tx.$executeRaw`
      insert into "WarehouseTransfer"(
        "id","fromWarehouseId","toWarehouseId","status","note","createdByUserId","createdAt"
      )
      values(
        ${id},
        ${from},
        ${to},
        "COMPLETED",
        ${String(input.note ?? "") || null},
        ${adminUserId},
        now()
      )
    `;
    await tx.$executeRaw`
      insert into "WarehouseTransferItem"("id","transferId","productId","quantity")
      values(${randomUUID()},${id},${productId},${quantity})
    `;

    await tx.inventoryMovement.create({
      data: {
        warehouseId: from,
        productId,
        type: "TRANSFER",
        quantity: -quantity,
        reference: id,
        note: "Transfer outbound",
      },
    });
    await tx.inventoryMovement.create({
      data: {
        warehouseId: to,
        productId,
        type: "TRANSFER",
        quantity,
        reference: id,
        note: "Transfer inbound",
      },
    });

    return { id };
  });
}
