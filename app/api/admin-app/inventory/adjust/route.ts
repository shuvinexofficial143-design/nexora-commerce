import { adjustStock, StockAdjustmentError, StockAdjustmentConflict } from "@/lib/admin/inventory-admin";
import { adminFailure, adminJson, adminOptions, adminUnexpected, requireAdmin } from "@/lib/admin/admin-api";

export const runtime = "nodejs";
export const OPTIONS = (request: Request) => adminOptions(request);
export async function POST(request: Request) {
  try {
    const session = await requireAdmin(request);
    if (!session) return adminFailure(request, "Admin authorization required.", 401);
    const body: unknown = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return adminFailure(request, "Invalid inventory adjustment request.", 400);
    }
    // Stock, movement and Owner audit commit/rollback in the same transaction.
    const result = await adjustStock(body as Record<string, unknown>, session.user.id);
    return adminJson(request, result);
  } catch (error) {
    if (error instanceof StockAdjustmentError) return adminFailure(request, error.message, 400);
    if (error instanceof StockAdjustmentConflict) return adminFailure(request, error.message, 409);
    return adminUnexpected(request, error);
  }
}
