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

    const url = new URL(request.url);
    const q = url.searchParams.get("q")?.trim() ?? "";
    const status = url.searchParams.get("status")?.trim() ?? "";

    const allowedStatuses = new Set([
      "PENDING",
      "CONFIRMED",
      "PROCESSING",
      "PACKED",
      "SHIPPED",
      "OUT_FOR_DELIVERY",
      "DELIVERED",
      "CANCELLED",
      "RETURN_REQUESTED",
      "RETURNED",
      "REFUNDED",
    ]);

    const orders = await getPrisma().order.findMany({
      where: {
        ...(status && allowedStatuses.has(status)
          ? { status: status as never }
          : {}),
        ...(q
          ? {
              OR: [
                { orderNumber: { contains: q, mode: "insensitive" } },
                { user: { name: { contains: q, mode: "insensitive" } } },
                { user: { email: { contains: q, mode: "insensitive" } } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true },
        },
        _count: { select: { items: true } },
      },
    });

    return adminJson(
      request,
      orders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        customer: order.user,
        totalMinor: order.totalMinor,
        subtotalMinor: order.subtotalMinor,
        taxMinor: order.taxMinor,
        shippingMinor: order.shippingMinor,
        discountMinor: order.discountMinor,
        status: order.status,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        itemCount: order._count.items,
        createdAt: order.createdAt.toISOString(),
      })),
    );
  } catch (error) {
    return adminUnexpected(request, error);
  }
}
