import { NextResponse } from "next/server";
import { resolveCoupon } from "@/lib/commerce/coupon-engine";
import { consumeRateLimit } from "@/lib/security/rate-limit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const rate = consumeRateLimit(request, "coupon-validate", 60, 10 * 60 * 1000);
    if (!rate.allowed) {
      return NextResponse.json(
        { ok: false, error: "Too many coupon checks. Try again shortly." },
        {
          status: 429,
          headers: { "Retry-After": String(rate.retryAfterSeconds) },
        },
      );
    }

    const body = (await request.json().catch(() => null)) as
      | { code?: unknown; subtotal?: unknown }
      | null;

    const code = String(body?.code ?? "").trim().toUpperCase();
    const subtotal = Number(body?.subtotal ?? 0);

    if (!code || code.length > 40) {
      return NextResponse.json(
        { ok: false, error: "Enter a valid coupon code." },
        { status: 400 },
      );
    }

    if (!Number.isFinite(subtotal) || subtotal < 0 || subtotal > 10_000_000) {
      return NextResponse.json(
        { ok: false, error: "Enter a valid cart subtotal." },
        { status: 400 },
      );
    }

    const result = await resolveCoupon(code, Math.round(subtotal * 100));
    return NextResponse.json({
      ok: true,
      data: {
        valid: Boolean(result.coupon),
        code: result.coupon?.code ?? null,
        discountMinor: result.discountMinor,
      },
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Could not validate coupon." },
      { status: 400 },
    );
  }
}
