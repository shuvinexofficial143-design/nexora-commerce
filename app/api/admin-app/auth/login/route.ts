import { verifyPassword } from "@/lib/auth/password";
import { findUserByEmail } from "@/lib/db/users";
import { issueAdminToken } from "@/lib/admin/admin-session";
import {
  ensureOwnerAdminUser,
  OWNER_ADMIN_COOKIE,
  ownerAdminConfigured,
  verifyOwnerCredentials,
} from "@/lib/admin/owner-auth";
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
      | { username?: unknown; email?: unknown; password?: unknown }
      | null;

    const username = String(body?.username ?? "").trim();
    const email = String(body?.email ?? "").trim().toLowerCase();
    const password = String(body?.password ?? "");

    let user;

    if (username) {
      if (!ownerAdminConfigured()) {
        return adminFailure(
          request,
          "Owner admin login is not configured. Set ADMIN_USERNAME and ADMIN_PASSWORD.",
          503,
        );
      }

      if (!verifyOwnerCredentials(username, password)) {
        return adminFailure(request, "Invalid admin username or password.", 401);
      }

      user = await ensureOwnerAdminUser();
    } else {
      if (!email || !password) {
        return adminFailure(request, "Admin username/email and password are required.", 400);
      }

      user = await findUserByEmail(email);

      if (!user || !(await verifyPassword(password, user.passwordHash))) {
        return adminFailure(request, "Invalid admin email or password.", 401);
      }

      if (user.status !== "ACTIVE") {
        return adminFailure(request, "This admin account is not active.", 403);
      }

      if (user.role !== "ADMIN") {
        return adminFailure(request, "This account does not have admin access.", 403);
      }
    }

    const session = await issueAdminToken(user.id);
    const response = adminJson(request, {
      token: session.token,
      expiresAt: session.expiresAt,
      admin: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });

    if (username) {
      response.cookies.set(OWNER_ADMIN_COOKIE, session.token, {
        httpOnly: true,
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 12 * 60 * 60,
      });
    }

    return response;
  } catch (error) {
    return adminUnexpected(request, error);
  }
}
