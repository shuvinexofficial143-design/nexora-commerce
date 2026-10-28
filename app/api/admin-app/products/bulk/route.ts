import { applyBulkProductAction, BulkProductConflict, parseBulkProductRequest } from "@/lib/admin/product-bulk";
import { adminFailure, adminJson, adminOptions, adminUnexpected, requireAdmin } from "@/lib/admin/admin-api";

export const runtime = "nodejs";
export const OPTIONS = (request: Request) => adminOptions(request);

export async function POST(request: Request) {
  try {
    const session = await requireAdmin(request);
    if (!session) return adminFailure(request, "Admin authorization required.", 401);
    const input = parseBulkProductRequest(await request.json().catch(() => null));
    const result = await applyBulkProductAction(input, session.user.id);
    return adminJson(request, result);
  } catch (error) {
    if (error instanceof BulkProductConflict) return adminFailure(request, error.message, 409);
    if (error instanceof Error && (/^Unsupported bulk|^Bulk product request|^Select between|^Invalid product selection|^Duplicate products|^Archived products/.test(error.message))) {
      return adminFailure(request, error.message, 400);
    }
    return adminUnexpected(request, error);
  }
}
