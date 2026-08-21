import { getPrisma, isDatabaseConfigured } from "@/lib/db/prisma";
import { apiError, ok } from "@/lib/server/backend";

export const runtime = "nodejs";

function safeHost(value?: string) {
  if (!value) return null;
  try {
    return new URL(value).hostname;
  } catch {
    return "configured";
  }
}

export async function GET() {
  try {
    if (!isDatabaseConfigured()) {
      return ok({
        configured: false,
        database: "not-configured",
        orm: "Prisma 7",
        runtimeHost: null,
        directHost: safeHost(process.env.DIRECT_URL),
      });
    }

    await getPrisma().$queryRaw`SELECT 1`;

    return ok({
      configured: true,
      database: "connected",
      orm: "Prisma 7",
      runtimeHost: safeHost(process.env.DATABASE_URL),
      directHost: safeHost(process.env.DIRECT_URL),
      supabaseReady: Boolean(process.env.DATABASE_URL?.includes("supabase")),
    });
  } catch (error) {
    return apiError(error);
  }
}
