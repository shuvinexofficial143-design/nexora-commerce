import { revokeAdminToken } from "@/lib/admin/admin-session";
import { OWNER_ADMIN_COOKIE } from "@/lib/admin/owner-auth";
import {
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
    await revokeAdminToken(request);
    const response = adminJson(request, { signedOut: true });
    response.cookies.set(OWNER_ADMIN_COOKIE, "", {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    });
    return response;
  } catch (error) {
    return adminUnexpected(request, error);
  }
}
