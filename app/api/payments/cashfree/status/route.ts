import { NextResponse } from "next/server";
import { cashfreeConfigured, syncCashfreePayment } from "@/lib/payments/cashfree";
import { consumeRateLimit } from "@/lib/security/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const rate = consumeRateLimit(request, "cashfree-status", 30, 10 * 60 * 1000);
    if (!rate.allowed) {
      return NextResponse.json(
        { ok: false, error: "Too many payment checks. Try again shortly." },
        {
          status: 429,
          headers: { "Retry-After": String(rate.retryAfterSeconds) },
        },
      );
    }
    if (!cashfreeConfigured()) {
      return NextResponse.json(
        { ok: false, error: "Cashfree online payments are not configured yet." },
        { status: 503 },
      );
    }

    const orderNumber = new URL(request.url).searchParams.get("order")?.trim() ?? "";
    if (!orderNumber) {
      return NextResponse.json(
        { ok: false, error: "Order number is required." },
        { status: 400 },
      );
    }

    const result = await syncCashfreePayment(orderNumber);
    return NextResponse.json({
      ok: true,
      data: { orderNumber, ...result },
    });
  } catch (error) {
    console.error("Cashfree status verification error", error);
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Could not verify payment status.",
      },
      { status: 400 },
    );
  }
}
