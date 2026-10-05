import { logAdmin } from "@/lib/admin/audit";
import { syncApprovedRefund } from "@/lib/admin/refund-orchestrator";
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
    const result = await syncApprovedRefund(returnId);

    await logAdmin({
      adminUserId: session.user.id,
      action: "REFUND_SYNC",
      entityType: "RETURN",
      entityId: returnId,
      summary: `Refund sync returned ${result.state}`,
    }).catch(() => undefined);

    return adminJson(request, result);
  } catch (error) {
    return adminUnexpected(request, error);
  }
}
