import { NextResponse } from "next/server";
import {
  cashfreeConfigured,
  createCashfreePaymentSession,
} from "@/lib/payments/cashfree";
import { checkRateLimit, rateLimitHeaders } from "@/lib/server/rate-limit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rate = checkRateLimit(request, {
    scope: "cashfree-session-create",
    limit: 10,
    windowMs: 10 * 60 * 1000,
  });

  if (!rate.allowed) {
    return NextResponse.json(
      { ok: false, error: "Too many payment attempts. Try again later." },
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

    const body = (await request.json().catch(() => null)) as
      | { orderNumber?: unknown; email?: unknown }
      | null;
    const orderNumber = String(body?.orderNumber ?? "").trim();
    const email = String(body?.email ?? "").trim().toLowerCase();

    if (!orderNumber || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { ok: false, error: "Order number and checkout email are required." },
        { status: 400 },
      );
    }

    const session = await createCashfreePaymentSession(orderNumber, email);
    return NextResponse.json({ ok: true, data: session });
  } catch (error) {
    console.error("Cashfree create-session error", error);
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Could not start online payment.",
      },
      { status: 400 },
    );
  }
}
