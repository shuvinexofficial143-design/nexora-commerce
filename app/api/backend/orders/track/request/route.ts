import { NextResponse } from "next/server";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { requestTrackingChallenge, TrackingInputError, TrackingUnavailableError } from "@/lib/orders/secure-tracking";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const headers = { "Cache-Control": "no-store" };
  const limit = consumeRateLimit(request, "tracking-request", 5, 15 * 60_000);
  if (!limit.allowed) return NextResponse.json(
    { ok: false, error: "Too many attempts. Please try again later." },
    { status: 429, headers: { ...headers, "Retry-After": String(limit.retryAfterSeconds) } },
  );
  try {
    const raw = await request.json().catch(() => null);
    const data = await requestTrackingChallenge(raw ?? {});
    return NextResponse.json({
      ok: true,
      data: { challengeId: data.challengeId, message: "If the details match an order, a verification code has been sent to the checkout email." },
    }, { status: 202, headers });
  } catch (error) {
    if (error instanceof TrackingInputError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 400, headers });
    }
    if (error instanceof TrackingUnavailableError) {
      return NextResponse.json({ ok: false, error: "Order verification is temporarily unavailable." }, { status: 503, headers });
    }
    console.error("NEXORA secure tracking challenge request failed", error);
    return NextResponse.json({ ok: false, error: "Could not request verification right now." }, { status: 500, headers });
  }
}
