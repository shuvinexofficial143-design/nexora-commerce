import { randomUUID } from "node:crypto";
import { getPrisma } from "@/lib/db/prisma";
import { assertProductPublishable } from "@/lib/admin/product-publish";

export type BulkProductAction = "PUBLISH" | "MOVE_TO_DRAFT" | "FEATURE" | "UNFEATURE";
export type BulkProductSelection = { id: string; updatedAt: string };
export type BulkProductRequest = { action: BulkProductAction; products: BulkProductSelection[] };

export class BulkProductConflict extends Error {
  constructor(message = "Products changed since selection. Refresh and select them again.") {
    super(message);
    this.name = "BulkProductConflict";
  }
}

export function parseBulkProductRequest(input: unknown): BulkProductRequest {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("Bulk product request must be an object.");
  }
  const record = input as Record<string, unknown>;
  if (Object.keys(record).some((key) => key !== "action" && key !== "products")) {
    throw new Error("Unsupported bulk product request field.");
  }
  const actions: BulkProductAction[] = ["PUBLISH", "MOVE_TO_DRAFT", "FEATURE", "UNFEATURE"];
  if (!actions.includes(record.action as BulkProductAction)) {
    throw new Error("Unsupported bulk product action.");
  }
  if (!Array.isArray(record.products) || record.products.length < 1 || record.products.length > 25) {
    throw new Error("Select between 1 and 25 products.");
  }
  const products: BulkProductSelection[] = [];
  const seen = new Set<string>();
  for (const item of record.products) {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw new Error("Invalid product selection.");
    }
    const selected = item as Record<string, unknown>;
    const id = selected.id;
    const updatedAt = selected.updatedAt;
    if (Object.keys(selected).some((key) => key !== "id" && key !== "updatedAt") ||
      typeof id !== "string" || id.length < 1 || id.length > 128 ||
      typeof updatedAt !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(updatedAt) ||
      !Number.isFinite(Date.parse(updatedAt)) || new Date(updatedAt).toISOString() !== updatedAt) {
      throw new Error("Invalid product selection or revision.");
    }
    if (seen.has(id)) throw new Error("Duplicate products cannot be selected.");
    seen.add(id);
    products.push({ id, updatedAt });
  }
  return { action: record.action as BulkProductAction, products };
}

export async function applyBulkProductAction(input: BulkProductRequest, adminUserId: string) {
  const { action, products } = parseBulkProductRequest(input);
  if (!adminUserId || adminUserId.length > 128) throw new Error("Invalid admin identity.");
  const prisma = getPrisma();
  return prisma.$transaction(async (tx) => {
    const rows = await tx.product.findMany({
      where: { id: { in: products.map((item) => item.id) } },
      select: { id: true, name: true, status: true, featured: true, updatedAt: true, categoryId: true, brandId: true, attributes: true },
    });
    const byId = new Map(rows.map((row) => [row.id, row]));
    if (rows.length !== products.length) throw new BulkProductConflict();
    for (const selected of products) {
      const row = byId.get(selected.id);
      if (!row || row.updatedAt.toISOString() !== selected.updatedAt) throw new BulkProductConflict();
      if (row.status === "ARCHIVED") {
        throw new Error("Archived products cannot be changed in bulk. Edit the product individually.");
      }
    }
    const changes = action === "PUBLISH" ? { status: "ACTIVE" as const }
      : action === "MOVE_TO_DRAFT" ? { status: "DRAFT" as const }
      : action === "FEATURE" ? { featured: true }
      : { featured: false };
    const changedIds: string[] = [];
    const unchangedIds: string[] = [];
    for (const selected of products) {
      const row = byId.get(selected.id)!;
      const unchanged = action === "PUBLISH" ? row.status === "ACTIVE"
        : action === "MOVE_TO_DRAFT" ? row.status === "DRAFT"
        : action === "FEATURE" ? row.featured
        : !row.featured;
      if (unchanged) {
        unchangedIds.push(selected.id);
        continue;
      }
      if (action === "PUBLISH") await assertProductPublishable(tx, row);
      const result = await tx.product.updateMany({
        where: { id: selected.id, updatedAt: row.updatedAt, status: { not: "ARCHIVED" } },
        data: changes,
      });
      if (result.count !== 1) throw new BulkProductConflict();
      // SQL is constant and all variables are separately bound. Audit shares this transaction.
      await tx.$executeRawUnsafe(
        'INSERT INTO "AdminActivityLog" ("id","adminUserId","action","entityType","entityId","summary","metadata","createdAt") VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,now())',
        randomUUID(), adminUserId, "PRODUCT_BULK_" + action, "PRODUCT", row.id,
        "Bulk " + action + ": " + row.name, JSON.stringify({ action, count: products.length }),
      );
      changedIds.push(selected.id);
    }
    return { action, requested: products.length, changed: changedIds.length, unchanged: unchangedIds.length, changedIds, unchangedIds };
  }, { maxWait: 5000, timeout: 20000 });
}
