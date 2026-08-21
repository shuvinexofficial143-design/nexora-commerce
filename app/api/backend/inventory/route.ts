import { getCurrentSession } from "@/lib/auth/session";
import { listInventory } from "@/lib/db/inventory";
import { apiError, ok } from "@/lib/server/backend";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await getCurrentSession();
    if (!session || !["ADMIN", "SUPPORT", "SELLER"].includes(session.user.role)) {
      return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
    }
    return ok(await listInventory());
  } catch (error) {
    return apiError(error);
  }
}
