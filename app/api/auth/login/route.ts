import { verifyPassword } from "@/lib/auth/password";
import { issueSession } from "@/lib/auth/session";
import { findUserByEmail, serializeUser } from "@/lib/db/users";
import { apiError, ok, validateLogin } from "@/lib/server/backend";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const input = validateLogin(await request.json());
    const user = await findUserByEmail(input.email);
    if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
      return NextResponse.json({ ok: false, error: "Invalid email or password." }, { status: 401 });
    }
    if (user.status !== "ACTIVE") {
      return NextResponse.json({ ok: false, error: "This account is not active." }, { status: 403 });
    }
    await issueSession(user.id);
    return ok({ user: serializeUser(user) });
  } catch (error) {
    return apiError(error);
  }
}
