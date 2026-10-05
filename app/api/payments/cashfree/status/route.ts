import { NextResponse } from "next/server";
import { cashfreeConfigured, syncCashfreePayment } from "@/lib/payments/cashfree";
import { checkRateLimit, rateLimitHeaders } from "@/lib/server/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const rate = checkRateLimit(request, {
    scope: "cashfree-status",
    limit: 30,
    windowMs: 5 * 60 * 1000,
  });

  if (!rate.allowed) {
    return NextResponse.json(
      { ok: false, error: "Too many payment status checks. Try again later." },
      { status: 429, headers: rateLimitHeaders(rate) },
    );
  }

  try {
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
