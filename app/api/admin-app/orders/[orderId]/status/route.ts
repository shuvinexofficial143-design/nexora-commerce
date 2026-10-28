import { ConflictError, NotFoundError, ValidationError } from "@/lib/db/errors";
import { changeOwnerOrderStatus, validateOwnerOrderStatus } from "@/lib/admin/order-status";
import { notify } from "@/lib/admin/notifications";
import { sendOrderEmailSafe } from "@/lib/notifications/customer-email";
import {
  adminFailure, adminJson, adminOptions, adminUnexpected, requireAdmin,
} from "@/lib/admin/admin-api";

export const runtime = "nodejs";
export const OPTIONS = (request: Request) => adminOptions(request);

type EmailStatus =
  | "CONFIRMED" | "PROCESSING" | "PACKED" | "SHIPPED"
  | "OUT_FOR_DELIVERY" | "DELIVERED" | "CANCELLED";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ orderId: string }> },
) {
  try {
    const session = await requireAdmin(request);
    if (!session) return adminFailure(request, "Admin authorization required.", 401);
    const { orderId } = await context.params;
    const body: unknown = await request.json().catch(() => null);
    const rawStatus = body && typeof body === "object" && !Array.isArray(body)
      ? (body as Record<string, unknown>).status : undefined;
    const status = validateOwnerOrderStatus(rawStatus);

    const result = await changeOwnerOrderStatus({
      orderId, status, adminUserId: session.user.id,
    });
    // No repeat email, notification or audit for an already-applied status.
    if (!result.unchanged) {
      const sideEffects: Promise<unknown>[] = [];
      if (status !== "PENDING") {
        sideEffects.push(sendOrderEmailSafe(result.id, status as EmailStatus));
      }
      if (status === "DELIVERED" || status === "CANCELLED") {
        sideEffects.push(notify({
          type: `ORDER_${status}`,
          title: `Order ${status.toLowerCase()}`,
          message: `${result.orderNumber} inventory reconciled`,
          entityType: "ORDER", entityId: result.id,
          severity: status === "DELIVERED" ? "SUCCESS" : "WARNING",
        }));
      }
      // A failed email/notification must not undo a committed order.
      await Promise.allSettled(sideEffects);
    }
    return adminJson(request, {
      ...result, updatedAt: result.updatedAt.toISOString(),
    });
  } catch (error) {
    if (error instanceof ValidationError) return adminFailure(request, error.message, 400);
    if (error instanceof NotFoundError) return adminFailure(request, error.message, 404);
    if (error instanceof ConflictError) return adminFailure(request, error.message, 409);
    return adminUnexpected(request, error);
  }
}
