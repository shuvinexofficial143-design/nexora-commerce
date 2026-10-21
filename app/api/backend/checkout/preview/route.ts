import { NextResponse } from "next/server";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { apiError } from "@/lib/server/backend";
import { createCheckoutPreview, validateCheckoutPreview } from "@/lib/commerce/checkout-preview";

export const runtime = "nodejs";
export async function POST(request: Request) {
  const headers = { "Cache-Control": "private, no-store" };
  const limit = consumeRateLimit(request, "checkout-preview", 30, 10 * 60_000);
  if (!limit.allowed) return NextResponse.json({
    ok: false, error: "Too many price checks. Try again shortly.",
  }, { status: 429, headers: { ...headers, "Retry-After": String(limit.retryAfterSeconds) } });
  try {
    const size = Number(request.headers.get("content-length") || 0);
    if (size > 24000) return NextResponse.json({ ok: false, error: "Cart request too large." }, { status: 413, headers });
    const body = await request.json().catch(() => null);
    const input = validateCheckoutPreview(body);
    const data = await createCheckoutPreview(input);
    return NextResponse.json({ ok: true, data }, { headers });
  } catch (error) {
    const response = apiError(error);
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  }
}
