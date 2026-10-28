import { getPrisma } from "@/lib/db/prisma";
import { serializeAdminProductListRow } from "@/lib/admin/product-list-row";
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

    const products = await getPrisma().product.findMany({
      orderBy: { updatedAt: "desc" },
      take: 100,
      include: {
        brand: { select: { name: true, slug: true } },
        category: { select: { name: true, slug: true } },
        inventory: {
          select: { onHand: true, reserved: true },
        },
        variants: { select: { priceMinor: true, onHand: true, reserved: true, active: true } },
        images: {
          orderBy: { sortOrder: "asc" },
          select: { url: true, alt: true, sortOrder: true },
        },
      },
    });

    return adminJson(request, products.map(serializeAdminProductListRow));
  } catch (error) {
    return adminUnexpected(request, error);
  }
}
