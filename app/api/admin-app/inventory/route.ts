import { getPrisma } from "@/lib/db/prisma";
import {
  adminFailure,
  adminJson,
  adminOptions,
  adminUnexpected,
  requireAdmin,
} from "@/lib/admin/admin-api";

export const runtime = "nodejs";

export function OPTIONS(request: Request) {
  return adminOptions(request);
}

export async function GET(request: Request) {
  try {
    const session = await requireAdmin(request);
    if (!session) return adminFailure(request, "Admin authorization required.", 401);

    const rows = await getPrisma().inventoryItem.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        product: {
          select: { id: true, name: true, sku: true, slug: true },
        },
        warehouse: {
          select: { id: true, code: true, name: true, city: true, state: true },
        },
      },
    });

    return adminJson(
      request,
      rows.map((row) => ({
        id: row.id,
        product: row.product,
        warehouse: row.warehouse,
        onHand: row.onHand,
        reserved: row.reserved,
        available: Math.max(0, row.onHand - row.reserved),
        reorderLevel: row.reorderLevel,
        lowStock:
          Math.max(0, row.onHand - row.reserved) <= row.reorderLevel,
        updatedAt: row.updatedAt.toISOString(),
      })),
    );
  } catch (error) {
    return adminUnexpected(request, error);
  }
}
