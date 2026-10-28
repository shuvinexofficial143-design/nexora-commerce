import { getPrisma } from "@/lib/db/prisma";
import { reconcileOrder } from "@/lib/admin/stock";
import { logAdmin } from "@/lib/admin/audit";
import { notify } from "@/lib/admin/notifications";
import { sendOrderEmailSafe } from "@/lib/notifications/customer-email";
import {
  adminFailure,
  adminJson,
  adminOptions,
  adminUnexpected,
  requireAdmin,
} from "@/lib/admin/admin-api";

export const runtime = "nodejs";

export const OPTIONS = (request: Request) => adminOptions(request);

const allowed = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "PACKED",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
] as const;

const progressRank: Record<string, number> = {
  PENDING: 0,
  CONFIRMED: 1,
  PROCESSING: 2,
  PACKED: 3,
  SHIPPED: 4,
  OUT_FOR_DELIVERY: 5,
  DELIVERED: 6,
};

class OrderStatusConflict extends Error {
  constructor() {
    super("Order changed while updating its status. Refresh the order and retry.");
    this.name = "OrderStatusConflict";
  }
}

type EmailStatus =
  | "CONFIRMED"
  | "PROCESSING"
  | "PACKED"
  | "SHIPPED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ orderId: string }> },
) {
  try {
    const session = await requireAdmin(request);
    if (!session) {
      return adminFailure(request, "Admin authorization required.", 401);
    }

    const { orderId } = await context.params;
    const body = (await request.json().catch(() => null)) as
      | { status?: unknown }
      | null;
    const status = String(body?.status ?? "");

    if (!allowed.includes(status as (typeof allowed)[number])) {
      return adminFailure(request, "Invalid order status.", 400);
    }

    const prisma = getPrisma();
    const order = await prisma.order.findFirst({
      where: { OR: [{ id: orderId }, { orderNumber: orderId }] },
      include: {
        items: { select: { productId: true, quantity: true } },
      },
    });

    if (!order) return adminFailure(request, "Order not found.", 404);

    if (order.status === status) {
      return adminJson(request, {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        updatedAt: order.updatedAt.toISOString(),
        unchanged: true,
      });
    }

    if (order.status === "DELIVERED") {
      return adminFailure(
        request,
        "Delivered order cannot move to another status.",
        409,
      );
    }

    if (order.status === "CANCELLED") {
      return adminFailure(
        request,
        "Cancelled order cannot move to another status.",
        409,
      );
    }

    if (
      status !== "CANCELLED" &&
      (progressRank[status] ?? -1) < (progressRank[order.status] ?? -1)
    ) {
      return adminFailure(
        request,
        "Order status cannot move backwards.",
        409,
      );
    }

    if (
      order.paymentMethod === "cashfree" &&
      order.paymentStatus !== "PAID" &&
      status !== "CANCELLED" &&
      status !== "PENDING"
    ) {
      return adminFailure(
        request,
        "Online-payment order cannot advance until payment is confirmed.",
        409,
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      // Claim the original revision BEFORE any inventory reconciliation.
      // Another Owner command winning the race cannot settle the stock twice.
      const claimed = await tx.order.updateMany({
        where: { id: order.id, status: order.status, updatedAt: order.updatedAt },
        data: { status: status as never },
      });
      if (claimed.count !== 1) throw new OrderStatusConflict();

      if (status === "DELIVERED") {
        await reconcileOrder(tx, order, "DELIVER");
      }
      if (status === "CANCELLED") {
        await reconcileOrder(tx, order, "CANCEL");
      }

      await logAdmin({
        adminUserId: session.user.id,
        action: "ORDER_STATUS_UPDATE",
        entityType: "ORDER",
        entityId: order.id,
        summary: `${order.orderNumber}: ${order.status} → ${status}`,
      }, tx);
      return tx.order.findUniqueOrThrow({
        where: { id: order.id },
        select: { id: true, orderNumber: true, status: true, updatedAt: true },
      });
    }, { maxWait: 5000, timeout: 15000 });

    // Irreversible external effects start only AFTER the audited transaction commits.
    const sideEffects: Promise<unknown>[] = [
      sendOrderEmailSafe(order.id, status as EmailStatus),
    ];

    if (["DELIVERED", "CANCELLED"].includes(status)) {
      sideEffects.push(
        notify({
          type: `ORDER_${status}`,
          title: `Order ${status.toLowerCase()}`,
          message: `${order.orderNumber} inventory reconciled`,
          entityType: "ORDER",
          entityId: order.id,
          severity: status === "DELIVERED" ? "SUCCESS" : "WARNING",
        }),
      );
    }

    await Promise.allSettled(sideEffects);

    return adminJson(request, {
      ...updated,
      updatedAt: updated.updatedAt.toISOString(),
    });
  } catch (error) {
    if (error instanceof OrderStatusConflict) return adminFailure(request, error.message, 409);
    return adminUnexpected(request, error);
  }
}
