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

    const prisma = getPrisma();

    const [orderCount, customerCount, revenue, inventory, recentOrders] =
      await Promise.all([
        prisma.order.count(),
        prisma.user.count({
          where: { role: "CUSTOMER", status: "ACTIVE" },
        }),
        prisma.order.aggregate({
          where: {
            status: {
              notIn: ["CANCELLED", "RETURNED", "REFUNDED"],
            },
          },
          _sum: { totalMinor: true },
        }),
        prisma.inventoryItem.findMany({
          select: {
            onHand: true,
            reserved: true,
            reorderLevel: true,
          },
        }),
        prisma.order.findMany({
          orderBy: { createdAt: "desc" },
          take: 5,
          include: {
            user: {
              select: { name: true, email: true },
            },
            _count: { select: { items: true } },
          },
        }),
      ]);

    const lowStock = inventory.filter(
      (row) => Math.max(0, row.onHand - row.reserved) <= row.reorderLevel,
    ).length;

    return adminJson(request, {
      stats: {
        revenueMinor: revenue._sum.totalMinor ?? 0,
        orders: orderCount,
        customers: customerCount,
        lowStock,
      },
      recentOrders: recentOrders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        customer: order.user.name,
        customerEmail: order.user.email,
        totalMinor: order.totalMinor,
        status: order.status,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        itemCount: order._count.items,
        createdAt: order.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    return adminUnexpected(request, error);
  }
}
