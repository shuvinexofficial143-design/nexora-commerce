import { processReturn } from "@/lib/admin/return-operations";
import { syncApprovedRefund } from "@/lib/admin/refund-orchestrator";
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

export async function POST(
  request: Request,
  context: { params: Promise<{ returnId: string }> },
) {
  try {
    const session = await requireAdmin(request);
    if (!session) {
      return adminFailure(request, "Admin authorization required.", 401);
    }

    const { returnId } = await context.params;
    const body = (await request.json().catch(() => null)) as
      | {
          status?: unknown;
          refund?: unknown;
          note?: unknown;
          restock?: unknown;
        }
      | null;

    const status = String(body?.status || "APPROVED").toUpperCase();
    if (!["APPROVED", "REJECTED"].includes(status)) {
      return adminFailure(request, "Invalid return resolution.", 400);
    }

    const refund = Number(body?.refund || 0);
    if (!Number.isFinite(refund) || refund < 0) {
      return adminFailure(
        request,
        "Refund amount must be zero or greater.",
        400,
      );
    }

    const note = String(body?.note || "").slice(0, 1000);
    const result = await processReturn({
      returnId,
      status,
      refundMinor: Math.round(refund * 100),
      note,
      restock: Boolean(body?.restock),
    });

    let refundResult:
      | Awaited<ReturnType<typeof syncApprovedRefund>>
      | null = null;

    if (status === "APPROVED" && result.refundMinor > 0) {
      try {
        refundResult = await syncApprovedRefund(returnId, note);
      } catch (error) {
        refundResult = {
          state: "ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Refund processing failed.",
          finalized: false,
        };

        await notify({
          type: "REFUND_ERROR",
          title: "Refund needs attention",
          message: `${result.orderNumber}: ${refundResult.message}`,
          entityType: "ORDER",
          entityId: result.orderId,
          severity: "WARNING",
        }).catch(() => undefined);
      }
    }

    await Promise.allSettled([
      logAdmin({
        adminUserId: session.user.id,
        action: "RETURN_PROCESS",
        entityType: "RETURN",
        entityId: returnId,
        summary: `${result.orderNumber}: return ${status.toLowerCase()}`,
      }),
      notify({
        type: `RETURN_${status}`,
        title: `Return ${status.toLowerCase()}`,
        message: `${result.orderNumber} return was ${status.toLowerCase()}`,
        entityType: "ORDER",
        entityId: result.orderId,
        severity: status === "APPROVED" ? "SUCCESS" : "WARNING",
      }),
      sendOrderEmailSafe(
        result.orderId,
        status === "APPROVED"
          ? "RETURN_APPROVED"
          : "RETURN_REJECTED",
      ),
    ]);

    return adminJson(request, {
      ...result,
      refund: refundResult,
    });
  } catch (error) {
    return adminUnexpected(request, error);
  }
}
