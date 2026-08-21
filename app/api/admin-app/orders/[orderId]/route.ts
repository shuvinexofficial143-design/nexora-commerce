import { getPrisma } from "@/lib/db/prisma";
import {
  adminFailure,
  adminJson,
  adminOptions,
  adminUnexpected,
  requireAdmin,
} from "@/lib/admin/admin-api";

export const runtime = "nodejs";

const ORDER_STATUSES = [
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
] as const;

type OrderStatusValue = (typeof ORDER_STATUSES)[number];

export function OPTIONS(request: Request) {
  return adminOptions(request);
}

async function findOrder(orderId: string) {
  return getPrisma().order.findFirst({
    where: {
      OR: [{ id: orderId }, { orderNumber: orderId }],
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          createdAt: true,
        },
      },
      items: {
        include: {
          product: {
            select: {
              slug: true,
              images: {
                orderBy: { sortOrder: "asc" },
                take: 1,
                select: { url: true, alt: true },
              },
            },
          },
        },
      },
    },
  });
}

export async function GET(
  request: Request,
  context: { params: Promise<{ orderId: string }> },
) {
  try {
    const session = await requireAdmin(request);
    if (!session) return adminFailure(request, "Admin authorization required.", 401);

    const { orderId } = await context.params;
    const order = await findOrder(orderId);
    if (!order) return adminFailure(request, "Order not found.", 404);

    return adminJson(request, {
      ...order,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      user: {
        ...order.user,
        createdAt: order.user.createdAt.toISOString(),
      },
    });
  } catch (error) {
    return adminUnexpected(request, error);
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ orderId: string }> },
) {
  try {
    const session = await requireAdmin(request);
    if (!session) return adminFailure(request, "Admin authorization required.", 401);

    const { orderId } = await context.params;
    const body = (await request.json().catch(() => null)) as
      | { status?: unknown }
      | null;

    const status = String(body?.status ?? "") as OrderStatusValue;
    if (!ORDER_STATUSES.includes(status)) {
      return adminFailure(request, "Invalid order status.", 400);
    }

    const current = await findOrder(orderId);
    if (!current) return adminFailure(request, "Order not found.", 404);

    if (current.status === status) {
      return adminJson(request, {
        id: current.id,
        orderNumber: current.orderNumber,
        status: current.status,
      });
    }

    if (
      ["CANCELLED", "RETURNED", "REFUNDED"].includes(current.status) &&
      current.status !== status
    ) {
      return adminFailure(
        request,
        "Terminal orders cannot be moved back to fulfilment.",
        409,
      );
    }

    const updated = await getPrisma().order.update({
      where: { id: current.id },
      data: { status },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        updatedAt: true,
      },
    });

    return adminJson(request, {
      ...updated,
      updatedAt: updated.updatedAt.toISOString(),
    });
  } catch (error) {
    return adminUnexpected(request, error);
  }
}
