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

    const customers = await getPrisma().user.findMany({
      where: { role: "CUSTOMER" },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        orders: {
          select: { totalMinor: true, status: true },
        },
      },
    });

    return adminJson(
      request,
      customers.map((customer) => ({
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        status: customer.status,
        createdAt: customer.createdAt.toISOString(),
        orderCount: customer.orders.length,
        lifetimeValueMinor: customer.orders
          .filter(
            (order) =>
              !["CANCELLED", "RETURNED", "REFUNDED"].includes(order.status),
          )
          .reduce((sum, order) => sum + order.totalMinor, 0),
      })),
    );
  } catch (error) {
    return adminUnexpected(request, error);
  }
}
