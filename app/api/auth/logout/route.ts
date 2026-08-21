import { revokeCurrentSession } from "@/lib/auth/session";
import { apiError, ok } from "@/lib/server/backend";

export const runtime = "nodejs";

export async function POST() {
  try {
    await revokeCurrentSession();
    return ok({ signedOut: true });
  } catch (error) {
    return apiError(error);
  }
}
