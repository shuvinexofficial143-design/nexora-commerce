import { randomUUID } from "node:crypto";
import { getPrisma } from "@/lib/db/prisma";

export async function listWarehouses() {
  return getPrisma().warehouse.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { inventory: true } } },
  });
}

export async function createWarehouse(input: Record<string, unknown>) {
  return getPrisma().warehouse.create({
    data: {
      id: randomUUID(),
      code: String(input.code ?? "").trim().toUpperCase(),
      name: String(input.name ?? "").trim(),
      city: String(input.city ?? "").trim(),
      state: String(input.state ?? "").trim(),
      active: true,
    },
  });
}

export async function toggleWarehouse(id: string, active: boolean) {
  return getPrisma().warehouse.update({ where: { id }, data: { active } });
}
