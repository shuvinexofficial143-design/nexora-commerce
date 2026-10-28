import { getPrisma } from "@/lib/db/prisma";
import { adminFailure, adminJson, adminOptions, adminUnexpected, requireAdmin } from "@/lib/admin/admin-api";
import { BannerValidationError, validateBanner } from "@/lib/home-banners";

export const runtime = "nodejs";
export const OPTIONS = (request: Request) => adminOptions(request);

export async function GET(request: Request) {
  try {
    if (!(await requireAdmin(request))) return adminFailure(request, "Admin authorization required.", 401);
    const rows = await getPrisma().homepageBanner.findMany({ orderBy: [{ archived: "asc" }, { sortOrder: "asc" }, { updatedAt: "desc" }] });
    return adminJson(request, rows);
  } catch (error) {
    if (error instanceof BannerValidationError) return adminFailure(request, error.message, 400);
    return adminUnexpected(request, error);
  }
}

export async function POST(request: Request) {
  try {
    if (!(await requireAdmin(request))) return adminFailure(request, "Admin authorization required.", 401);
    const data = validateBanner(await request.json().catch(() => null));
    const row = await getPrisma().homepageBanner.create({ data });
    return adminJson(request, row, 201);
  } catch (error) { return adminUnexpected(request, error); }
}