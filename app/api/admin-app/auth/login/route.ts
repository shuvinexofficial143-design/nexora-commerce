import { verifyPassword } from "@/lib/auth/password";
import { findUserByEmail } from "@/lib/db/users";
import { issueAdminToken } from "@/lib/admin/admin-session";
import {
  adminFailure,
  adminJson,
  adminOptions,
  adminUnexpected,
} from "@/lib/admin/admin-api";

export const runtime = "nodejs";

export function OPTIONS(request: Request) {
  return adminOptions(request);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as
      | { email?: unknown; password?: unknown }
      | null;

    const email = String(body?.email ?? "").trim().toLowerCase();
    const password = String(body?.password ?? "");

    if (!email || !password) {
      return adminFailure(request, "Admin email and password are required.", 400);
    }

    const user = await findUserByEmail(email);

    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return adminFailure(request, "Invalid admin email or password.", 401);
    }

    if (user.status !== "ACTIVE") {
      return adminFailure(request, "This admin account is not active.", 403);
    }

    if (user.role !== "ADMIN") {
      return adminFailure(request, "This account does not have admin access.", 403);
    }

    const session = await issueAdminToken(user.id);

    return adminJson(request, {
      token: session.token,
      expiresAt: session.expiresAt,
      admin: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    return adminUnexpected(request, error);
  }
}
