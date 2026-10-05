import { NextResponse } from "next/server";
import {
  cashfreeConfigured,
  syncCashfreePayment,
  verifyCashfreeWebhookSignature,
} from "@/lib/payments/cashfree";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CashfreeWebhook = {
  type?: string;
  data?: {
    order?: { order_id?: string };
    payment?: { payment_status?: string };
  };
};

export async function POST(request: Request) {
  try {
    if (!cashfreeConfigured()) {
      return NextResponse.json(
        { ok: false, error: "Cashfree is not configured." },
        { status: 503 },
      );
    }

    const rawBody = await request.text();
    const signature = request.headers.get("x-webhook-signature");
    const timestamp = request.headers.get("x-webhook-timestamp");

    if (!verifyCashfreeWebhookSignature(rawBody, signature, timestamp)) {
      return NextResponse.json(
        { ok: false, error: "Invalid webhook signature." },
        { status: 401 },
      );
    }

    const payload = JSON.parse(rawBody) as CashfreeWebhook;
    const orderNumber = payload.data?.order?.order_id?.trim();

    if (!orderNumber) {
      return NextResponse.json(
        { ok: false, error: "Webhook order id is missing." },
        { status: 400 },
      );
    }

    const result = await syncCashfreePayment(orderNumber);

    return NextResponse.json({
      ok: true,
      data: {
        received: true,
        event: payload.type ?? null,
        orderNumber,
        state: result.state,
      },
    });
  } catch (error) {
    console.error("Cashfree webhook error", error);
    return NextResponse.json(
      { ok: false, error: "Webhook processing failed." },
      { status: 500 },
    );
  }
}
