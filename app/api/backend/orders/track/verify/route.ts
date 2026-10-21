import { NextResponse } from "next/server";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { TrackingInputError, TrackingUnavailableError, verifyTrackingChallenge } from "@/lib/orders/secure-tracking";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const headers = { "Cache-Control": "no-store" };
  const limit = consumeRateLimit(request, "tracking-verify", 15, 15 * 60_000);
  if (!limit.allowed) return NextResponse.json({ ok: false, error: "Too many verification attempts." }, {
    status: 429, headers: { ...headers, "Retry-After": String(limit.retryAfterSeconds) },
  });
  try {
    const body = await request.json().catch(() => null);
    const access = await verifyTrackingChallenge(body ?? {});
    if (!access) return NextResponse.json({ ok: false, error: "Invalid or expired code. Request a new code if necessary." }, {
      status: 401, headers,
    });
    return NextResponse.json({ ok: true, data: access }, { headers });
  } catch (error) {
    if (error instanceof TrackingInputError) return NextResponse.json({ ok: false, error: error.message }, { status: 400, headers });
    if (error instanceof TrackingUnavailableError) return NextResponse.json({ ok: false, error: "Order verification is temporarily unavailable." }, { status: 503, headers });
    console.error("NEXORA order verification failed", error);
    return NextResponse.json({ ok: false, error: "Verification failed. Try again later." }, { status: 500, headers });
  }
}
