import { getCurrentSession } from "@/lib/auth/session";
import { createOrder, listOrdersForUser } from "@/lib/db/orders";
import { getOrCreateGuestCustomer } from "@/lib/db/users";
import { apiError, ok, validateOrder } from "@/lib/server/backend";
import { NextResponse } from "next/server";
import { consumeRateLimit } from "@/lib/security/rate-limit";

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
    const rate = consumeRateLimit(request, "guest-order-create", 20, 10 * 60 * 1000);
    if (!rate.allowed) {
      return NextResponse.json(
        { ok: false, error: "Too many order attempts. Try again shortly." },
        {
          status: 429,
          headers: { "Retry-After": String(rate.retryAfterSeconds) },
        },
      );
    }
    const payload = validateOrder(await request.json());
    const session = await getCurrentSession();

    const user = session?.user ?? await getOrCreateGuestCustomer({
      email: payload.contactEmail!,
      name: payload.shippingAddress.fullName,
      phone: payload.shippingAddress.phone,
    });

    const order = await createOrder(user.id, payload);
    return ok(order, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
