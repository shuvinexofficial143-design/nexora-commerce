import { getPrisma } from "@/lib/db/prisma";

export class BannerReorderConflict extends Error {
  constructor() {
    super("Homepage banners changed. Refresh and try reordering again.");
    this.name = "BannerReorderConflict";
  }
}

export type BannerOrderItem = { id: string; updatedAt: string };

export function parseBannerReorder(input: unknown): BannerOrderItem[] {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Invalid banner reorder request.");
  const payload = input as Record<string, unknown>;
  if (Object.keys(payload).some(key => key !== "items") ||
    !Array.isArray(payload.items) || payload.items.length < 2 || payload.items.length > 100) {
    throw new Error("Select between 2 and 100 active banners to reorder.");
  }
  const seen = new Set<string>();
  return payload.items.map((value: unknown) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid banner revision.");
    const item = value as Record<string, unknown>;
    if (Object.keys(item).some(key => key !== "id" && key !== "updatedAt") ||
      typeof item.id !== "string" || !item.id.trim() || item.id.length > 128 ||
      typeof item.updatedAt !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(item.updatedAt) ||
      !Number.isFinite(Date.parse(item.updatedAt)) || new Date(item.updatedAt).toISOString() !== item.updatedAt) {
      throw new Error("Invalid banner revision.");
    }
    if (seen.has(item.id)) throw new Error("Duplicate banner IDs are not allowed.");
    seen.add(item.id);
    return { id: item.id, updatedAt: item.updatedAt };
  });
}

export async function reorderHomepageBanners(input: unknown) {
  const items = parseBannerReorder(input);
  return getPrisma().$transaction(async tx => {
    const active = await tx.homepageBanner.findMany({
      where: { archived: false }, select: { id: true, updatedAt: true },
    });
    if (active.length !== items.length) throw new BannerReorderConflict();
    const current = new Map(active.map(row => [row.id, row]));
    for (const item of items) {
      if (current.get(item.id)?.updatedAt.toISOString() !== item.updatedAt) throw new BannerReorderConflict();
    }
    for (let index = 0; index < items.length; index++) {
      const item = items[index];
      const affected = await tx.homepageBanner.updateMany({
        where: { id: item.id, updatedAt: current.get(item.id)!.updatedAt, archived: false },
        data: { sortOrder: index },
      });
      if (affected.count !== 1) throw new BannerReorderConflict();
    }
    return { reordered: items.length };
  }, { maxWait: 5000, timeout: 20000 });
}
