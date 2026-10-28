import { onboardSeller, SellerOnboardingConflict, SellerOnboardingValidationError } from "@/lib/admin/seller-onboarding";
import { adminFailure, adminJson, adminOptions, adminUnexpected, requireAdmin } from "@/lib/admin/admin-api";

export const runtime = "nodejs";
export const OPTIONS = (request: Request) => adminOptions(request);
export async function POST(request: Request) {
  try {
    const session = await requireAdmin(request);
    if (!session) return adminFailure(request, "Admin authorization required.", 401);
    const input: unknown = await request.json().catch(() => null);
    if (!input || typeof input !== "object" || Array.isArray(input)) {
      return adminFailure(request, "Invalid seller onboarding request.", 400);
    }
    return adminJson(request, await onboardSeller(input as Record<string, unknown>, session.user.id), 201);
  } catch (error) {
    if (error instanceof SellerOnboardingValidationError) return adminFailure(request, error.message, 400);
    if (error instanceof SellerOnboardingConflict) return adminFailure(request, error.message, 409);
    return adminUnexpected(request, error);
  }
}
