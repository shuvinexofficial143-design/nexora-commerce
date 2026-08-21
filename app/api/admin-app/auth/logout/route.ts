import { revokeAdminToken } from "@/lib/admin/admin-session";
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
    return adminJson(request, { signedOut: true });
  } catch (error) {
    return adminUnexpected(request, error);
  }
}
