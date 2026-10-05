import { NextResponse } from "next/server";
import {
  cashfreeConfigured,
  createCashfreePaymentSession,
} from "@/lib/payments/cashfree";

export const runtime = "nodejs";

export async function POST(request: Request) {
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
