import { getPrisma } from "@/lib/db/prisma";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/db/errors";
import { reconcileOrder } from "@/lib/admin/stock";
import { logAdmin } from "@/lib/admin/audit";

// Return / refund fulfillment needs dedicated payment and stock workflows.
// A generic status PATCH must never mark returns or refunds as complete.
export const allowedOwnerOrderStatuses = [
  "PENDING", "CONFIRMED", "PROCESSING", "PACKED",
  "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED",
] as const;
export type OwnerOrderStatus = typeof allowedOwnerOrderStatuses[number];

const progressRank: Record<string, number> = {
  PENDING: 0, CONFIRMED: 1, PROCESSING: 2, PACKED: 3,
  SHIPPED: 4, OUT_FOR_DELIVERY: 5, DELIVERED: 6,
};

export function validateOwnerOrderStatus(raw: unknown): OwnerOrderStatus {
  if (typeof raw !== "string" ||
      !(allowedOwnerOrderStatuses as readonly string[]).includes(raw)) {
    throw new ValidationError("Invalid order status. Returns and refunds require a dedicated workflow.");
  }
  return raw as OwnerOrderStatus;
}

export function validateOrderTransition(
  current: { status: string; paymentMethod: string | null; paymentStatus: string },
  requested: OwnerOrderStatus,
): "unchanged" | "update" {
  if (current.status === requested) return "unchanged";
  if (current.status === "DELIVERED" || current.status === "CANCELLED" ||
      progressRank[current.status] === undefined) {
    throw new ConflictError("Terminal or return-pending orders cannot return to fulfilment.");
  }
  if (requested !== "CANCELLED" && progressRank[requested] < progressRank[current.status]) {
    throw new ConflictError("Order status cannot move backwards.");
  }
  if (current.paymentMethod === "cashfree" && current.paymentStatus !== "PAID" &&
      requested !== "CANCELLED" && requested !== "PENDING") {
    throw new ConflictError("Online-payment order cannot advance until payment is confirmed.");
  }
  return "update";
}

/**
 * An order's row is locked BEFORE reading current status or inventory movements.
 * Concurrent commands on either Admin endpoint serialize on the same row.
 * Audit, inventory movement and order status commit/rollback together.
 */
export async function changeOwnerOrderStatus(input: {
  orderId: string; status: OwnerOrderStatus; adminUserId: string;
}) {
  const { orderId, status, adminUserId } = input;
  // Enforce this at the service boundary too, not only at HTTP routing.
  // Internal callers must not bypass the refund/return lifecycle guard.
  validateOwnerOrderStatus(status);
  if (!orderId || orderId.length > 128 || !adminUserId || adminUserId.length > 128) {
    throw new ValidationError("Invalid order or owner identity.");
  }
  const prisma = getPrisma();
  return prisma.$transaction(async tx => {
    const locked = await tx.$queryRaw<Array<{ id: string }>>`
      SELECT "id" FROM "Order"
      WHERE "id" = ${orderId} OR "orderNumber" = ${orderId}
      FOR UPDATE
    `;
    if (locked.length !== 1) throw new NotFoundError("Order not found.");
    // Read after acquiring lock; no stale pre-transaction status/revision.
    const order = await tx.order.findUniqueOrThrow({
      where: { id: locked[0].id },
      include: { items: { select: {
        productId: true, productVariantId: true, quantity: true,
      } } },
    });
    if (validateOrderTransition(order, status) === "unchanged") {
      return {
        id: order.id, orderNumber: order.orderNumber, status: order.status,
        updatedAt: order.updatedAt, unchanged: true as const,
      };
    }
    if (status === "DELIVERED" || status === "CANCELLED") {
      // Keep the reusable settlement helper idempotent for existing callers.
      // But a nonterminal order with settlement movements already recorded
      // signals inconsistent legacy state and must not silently advance.
      const [baseSettled, skuSettled] = await Promise.all([
        tx.inventoryMovement.findFirst({
          where: { reference: order.orderNumber, note: { startsWith: "ORDER_SETTLED:" } },
          select: { id: true },
        }),
        tx.productVariantMovement.findFirst({
          where: { reference: order.orderNumber, type: { in: ["OUTBOUND", "RELEASE"] } },
          select: { id: true },
        }),
      ]);
      if (baseSettled || skuSettled) {
        throw new ConflictError("Order already has settlement movements; manual reconciliation required.");
      }
      await reconcileOrder(tx, order, status === "DELIVERED" ? "DELIVER" : "CANCEL");
    }
    const updated = await tx.order.update({
      where: { id: order.id }, data: { status },
      select: { id: true, orderNumber: true, status: true, updatedAt: true },
    });
    await logAdmin({
      adminUserId,
      action: "ORDER_STATUS_UPDATE",
      entityType: "ORDER",
      entityId: order.id,
      summary: `${order.orderNumber}: ${order.status} → ${status}`,
    }, tx);
    return { ...updated, unchanged: false as const };
  }, { maxWait: 10_000, timeout: 15_000 });
}
