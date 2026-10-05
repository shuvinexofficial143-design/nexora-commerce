import { hashPassword } from "@/lib/auth/password";
import { issueSession } from "@/lib/auth/session";
import { createUser, serializeUser } from "@/lib/db/users";
import { apiError, ok, validateRegistration } from "@/lib/server/backend";
import { publicCustomerAuthEnabled } from "@/lib/config/features";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    if (!publicCustomerAuthEnabled()) {
      return NextResponse.json(
        { ok: false, error: "Customer accounts are disabled." },
        { status: 404 },
      );
    }

    const rate = consumeRateLimit(request, "customer-register", 5, 60 * 60 * 1000);
    if (!rate.allowed) {
      return NextResponse.json(
        { ok: false, error: "Too many registration attempts. Try again later." },
        {
          status: 429,
          headers: { "Retry-After": String(rate.retryAfterSeconds) },
        },
      );
    }
    const input = validateRegistration(await request.json());
    const passwordHash = await hashPassword(input.password);
    const user = await createUser({ ...input, passwordHash });
    await issueSession(user.id);
    return ok({ user: serializeUser(user) }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
