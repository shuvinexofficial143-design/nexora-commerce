import { getPrisma } from "@/lib/db/prisma";

export async function listInventory() {
  const rows = await getPrisma().inventoryItem.findMany({
    include: {
      product: { select: { id: true, sku: true, name: true, slug: true } },
      warehouse: { select: { id: true, code: true, name: true, city: true, state: true } },
    },
    orderBy: [{ warehouse: { code: "asc" } }, { product: { name: "asc" } }],
  });

  return rows.map((row) => ({
    id: row.id,
    product: row.product,
    warehouse: row.warehouse,
    onHand: row.onHand,
    reserved: row.reserved,
    available: Math.max(0, row.onHand - row.reserved),
    reorderLevel: row.reorderLevel,
    lowStock: Math.max(0, row.onHand - row.reserved) <= row.reorderLevel,
    updatedAt: row.updatedAt.toISOString(),
  }));
}
