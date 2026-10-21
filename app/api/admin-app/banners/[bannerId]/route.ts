import { getPrisma } from "@/lib/db/prisma";
import { adminFailure, adminJson, adminOptions, adminUnexpected, requireAdmin } from "@/lib/admin/admin-api";
import { validateBanner } from "@/lib/home-banners";

export const runtime = "nodejs";
export const OPTIONS = (request: Request) => adminOptions(request);

export async function PATCH(request: Request, context: { params: Promise<{ bannerId: string }> }) {
  try {
    if (!(await requireAdmin(request))) return adminFailure(request, "Admin authorization required.", 401);
    const { bannerId } = await context.params;
    const data = validateBanner(await request.json());
    return adminJson(request, await getPrisma().homepageBanner.update({ where: { id: bannerId }, data }));
  } catch (error) { return adminUnexpected(request, error); }
}