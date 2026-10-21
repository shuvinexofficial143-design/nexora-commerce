import { NextResponse } from "next/server";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { findTrackedOrder, normalizeTrackingToken } from "@/lib/orders/secure-tracking";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const headers = { "Cache-Control": "private, no-store", "Vary": "Authorization" };
  const rate = consumeRateLimit(request, "order-track", 30, 10 * 60_000);
  if (!rate.allowed) return NextResponse.json(
    { ok: false, error: "Too many tracking requests. Try again later." },
    { status: 429, headers: { ...headers, "Retry-After": String(rate.retryAfterSeconds) } },
  );
  // Deliberately DO NOT accept the legacy ?order=&email= unauthenticated lookup.
  const token = normalizeTrackingToken(request.headers.get("authorization"));
  if (!token) return NextResponse.json({ ok: false, error: "Verify your checkout email to access this order." }, { status: 401, headers });
  try {
    const order = await findTrackedOrder(token);
    if (!order) return NextResponse.json({ ok: false, error: "Order access expired or unavailable. Verify again." }, { status: 401, headers });
    return NextResponse.json({ ok: true, data: order }, { headers });
  } catch (error) {
    console.error("NEXORA secure order tracking retrieval failed", error);
    return NextResponse.json({ ok: false, error: "Could not check your order right now." }, { status: 500, headers });
  }
}
