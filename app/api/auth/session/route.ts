import { getCurrentSession } from "@/lib/auth/session";
import { apiError, ok } from "@/lib/server/backend";
import { publicCustomerAuthEnabled } from "@/lib/config/features";

export const runtime = "nodejs";

export async function GET() {
  try {
    if (!publicCustomerAuthEnabled()) {
      return ok({ session: null });
    }
    return ok({ session: await getCurrentSession() });
  } catch (error) {
    return apiError(error);
  }
}
