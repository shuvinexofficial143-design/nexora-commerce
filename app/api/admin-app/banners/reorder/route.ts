import { adminFailure, adminJson, adminOptions, adminUnexpected, requireAdmin } from "@/lib/admin/admin-api";
import { BannerReorderConflict, reorderHomepageBanners } from "@/lib/admin/banner-order";

export const runtime = "nodejs";
export const OPTIONS = (request: Request) => adminOptions(request);

export async function POST(request: Request) {
  try {
    const session = await requireAdmin(request);
    if (!session) return adminFailure(request, "Admin authorization required.", 401);
    return adminJson(request, await reorderHomepageBanners(await request.json().catch(() => null)));
  } catch (error) {
    if (error instanceof BannerReorderConflict) return adminFailure(request, error.message, 409);
    if (error instanceof Error && /^(Invalid banner|Select between 2 and 100|Duplicate banner)/.test(error.message)) {
      return adminFailure(request, error.message, 400);
    }
    return adminUnexpected(request, error);
  }
}
