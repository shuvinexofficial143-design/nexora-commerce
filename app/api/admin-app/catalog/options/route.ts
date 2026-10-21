import { getPrisma } from "@/lib/db/prisma";
import {
  adminFailure,
  adminJson,
  adminOptions,
  adminUnexpected,
  requireAdmin,
} from "@/lib/admin/admin-api";

export const runtime = "nodejs";

export function OPTIONS(request: Request) {
  return adminOptions(request);
}

export async function GET(request: Request) {
  try {
    const session = await requireAdmin(request);
    if (!session) return adminFailure(request, "Admin authorization required.", 401);

    const [categories, brands] = await Promise.all([
      getPrisma().category.findMany({ orderBy: { name: "asc" }, select: { name: true, slug: true } }),
      getPrisma().brand.findMany({ orderBy: { name: "asc" }, select: { name: true, slug: true } }),
    ]);

    return adminJson(request, { categories, brands });
  } catch (error) {
    return adminUnexpected(request, error);
  }
}