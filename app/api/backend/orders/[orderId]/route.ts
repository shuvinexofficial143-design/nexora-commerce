import { getCurrentSession } from "@/lib/auth/session";
import { getOrderForUser } from "@/lib/db/orders";
import { apiError, ok } from "@/lib/server/backend";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ orderId: string }> }) {
  try {
    const session = await getCurrentSession();
    if (!session) return NextResponse.json({ ok: false, error: "Sign in required." }, { status: 401 });
    const { orderId } = await context.params;
    const elevated = ["ADMIN", "SUPPORT"].includes(session.user.role);
    return ok(await getOrderForUser(session.user.id, orderId, elevated));
  } catch (error) {
    return apiError(error);
  }
}
