import { getCurrentSession } from "@/lib/auth/session";
import { apiError, ok } from "@/lib/server/backend";

export const runtime = "nodejs";

export async function GET() {
  try {
    return ok({ session: await getCurrentSession() });
  } catch (error) {
    return apiError(error);
  }
}
