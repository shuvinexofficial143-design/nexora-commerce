import { getPrisma } from "@/lib/db/prisma";
import {
  adminFailure,
  adminJson,
  adminOptions,
  adminUnexpected,
  requireAdmin,
} from "@/lib/admin/admin-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function OPTIONS(request: Request) {
  return adminOptions(request);
}

export async function GET(request: Request) {
  try {
    const session = await requireAdmin(request);
    if (!session) return adminFailure(request, "Admin authorization required.", 401);

    await getPrisma().$queryRaw`select 1`;

    return adminJson(request, {
      service: "nexora-admin-api",
      database: "connected",
      admin: session.user.email,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return adminUnexpected(request, error);
  }
}
