import { NextResponse } from "next/server";
import { cashfreeConfigured, syncCashfreePayment } from "@/lib/payments/cashfree";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
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
