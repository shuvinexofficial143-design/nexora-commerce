import { getCurrentSession } from "@/lib/auth/session";
import { createOrder, listOrdersForUser } from "@/lib/db/orders";
import { apiError, ok, validateOrder } from "@/lib/server/backend";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await getCurrentSession();
    if (!session) return NextResponse.json({ ok: false, error: "Sign in required." }, { status: 401 });
    return ok(await listOrdersForUser(session.user.id));
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await getCurrentSession();
    if (!session) return NextResponse.json({ ok: false, error: "Sign in required." }, { status: 401 });
    const payload = validateOrder(await request.json());
    const order = await createOrder(session.user.id, payload);
    return ok(order, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
