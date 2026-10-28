import { transferStock, WarehouseTransferConflict, WarehouseTransferValidationError } from "@/lib/admin/warehouse-transfer";
import { adminFailure, adminJson, adminOptions, adminUnexpected, requireAdmin } from "@/lib/admin/admin-api";

export const runtime = "nodejs";
export const OPTIONS = (request: Request) => adminOptions(request);

export async function POST(request: Request) {
  try {
    const session = await requireAdmin(request);
    if (!session) return adminFailure(request, "Admin authorization required.", 401);
    const input: unknown = await request.json().catch(() => null);
    if (!input || typeof input !== "object" || Array.isArray(input)) {
      return adminFailure(request, "Invalid warehouse transfer request.", 400);
    }
    const result = await transferStock(session.user.id, input as Record<string, unknown>);
    return adminJson(request, result, 201);
  } catch (error) {
    if (error instanceof WarehouseTransferValidationError) return adminFailure(request, error.message, 400);
    if (error instanceof WarehouseTransferConflict) return adminFailure(request, error.message, 409);
    return adminUnexpected(request, error);
  }
}
