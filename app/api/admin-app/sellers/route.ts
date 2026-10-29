import { adminFailure, adminJson, adminOptions, adminUnexpected, requireAdmin } from "@/lib/admin/admin-api";
import { listSellers, updateSeller, SellerReviewError } from "@/lib/admin/sellers";

export const runtime = "nodejs";
export const OPTIONS = (request: Request) => adminOptions(request);

export async function GET(request: Request) {
  try {
    if (!(await requireAdmin(request))) return adminFailure(request, "Admin authorization required.", 401);
    return adminJson(request, await listSellers());
  } catch (error) { return adminUnexpected(request, error); }
}

export async function PATCH(request: Request) {
  try {
    const session = await requireAdmin(request);
    if (!session) return adminFailure(request, "Admin authorization required.", 401);
    const body: unknown = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body))
      return adminFailure(request, "Invalid seller review request.", 400);
    const input = body as Record<string, unknown>;
    const id = typeof input.id === "string" ? input.id.trim() : "";
    return adminJson(request, await updateSeller(id, input, session.user.id));
  } catch (error) {
    if (error instanceof SellerReviewError) return adminFailure(request, error.message, error.status);
    return adminUnexpected(request, error);
  }
}
