import { NextResponse } from "next/server";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { apiError } from "@/lib/server/backend";
import { recoverCompletedCheckoutAttempt, validateCheckoutRecoveryRequest } from "@/lib/commerce/checkout-attempt-recovery";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const headers = { "Cache-Control": "private, no-store" };
  const rate = consumeRateLimit(request, "checkout-attempt-recovery", 10, 10 * 60_000);
  if (!rate.allowed) return NextResponse.json(
    { ok: false, error: "Too many order recovery checks. Try again shortly." },
    { status: 429, headers: { ...headers, "Retry-After": String(rate.retryAfterSeconds) } },
  );
  try {
    const size = Number(request.headers.get("content-length") || 0);
    if (size > 2048) return NextResponse.json(
      { ok: false, error: "Recovery request too large." }, { status: 413, headers },
    );
    const input = validateCheckoutRecoveryRequest(await request.json().catch(() => null));
    const result = await recoverCompletedCheckoutAttempt(input);
    return NextResponse.json({ ok: true, data: result }, { headers });
  } catch (error) {
    const response = apiError(error);
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  }
}
