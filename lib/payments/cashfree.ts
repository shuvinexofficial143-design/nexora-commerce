import { createHmac, timingSafeEqual } from "node:crypto";
import { getPrisma } from "@/lib/db/prisma";
import { getPublicAppUrl } from "@/lib/config/runtime";

const API_VERSION = "2025-01-01";

type CashfreeMode = "sandbox" | "production";

type CashfreeOrderResponse = {
  order_id: string;
  order_status?: string;
  payment_session_id?: string;
};

type CashfreePayment = {
  cf_payment_id?: string | number;
  payment_status?: string;
  payment_amount?: number;
  payment_currency?: string;
  payment_time?: string;
};

function mode(): CashfreeMode {
  return process.env.CASHFREE_ENV === "production" ? "production" : "sandbox";
}

function baseUrl() {
  const explicit = process.env.CASHFREE_API_BASE?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  return mode() === "production"
    ? "https://api.cashfree.com/pg"
    : "https://sandbox.cashfree.com/pg";
}

function credentials() {
  const clientId = process.env.CASHFREE_CLIENT_ID?.trim();
  const clientSecret = process.env.CASHFREE_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) {
    throw new Error("Cashfree is not configured. Add CASHFREE_CLIENT_ID and CASHFREE_CLIENT_SECRET.");
  }
  return { clientId, clientSecret };
}

export function cashfreeConfigured() {
  return Boolean(
    process.env.CASHFREE_CLIENT_ID?.trim() &&
      process.env.CASHFREE_CLIENT_SECRET?.trim(),
  );
}

export function cashfreeMode(): CashfreeMode {
  return mode();
}

async function cashfreeFetch<T>(
  path: string,
  init: RequestInit = {},
  allowNotFound = false,
): Promise<T | null> {
  const { clientId, clientSecret } = credentials();
  const response = await fetch(`${baseUrl()}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      "x-client-id": clientId,
      "x-client-secret": clientSecret,
      "x-api-version": API_VERSION,
      Accept: "application/json",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(init.headers ?? {}),
    },
  });

  if (allowNotFound && response.status === 404) return null;

  const payload = (await response.json().catch(() => null)) as
    | (T & { message?: string; type?: string; code?: string })
    | null;

  if (!response.ok) {
    throw new Error(
      payload?.message ||
        `Cashfree request failed with HTTP ${response.status}.`,
    );
  }

  return payload as T;
}

export async function getCashfreeOrder(orderNumber: string) {
  return cashfreeFetch<CashfreeOrderResponse>(
    `/orders/${encodeURIComponent(orderNumber)}`,
    { method: "GET" },
    true,
  );
}

export async function getCashfreePayments(orderNumber: string) {
  return (
    (await cashfreeFetch<CashfreePayment[]>(
      `/orders/${encodeURIComponent(orderNumber)}/payments`,
      { method: "GET" },
    )) ?? []
  );
}

function readShippingPhone(shippingAddress: unknown) {
  if (
    shippingAddress &&
    typeof shippingAddress === "object" &&
    "phone" in shippingAddress
  ) {
    return String((shippingAddress as { phone?: unknown }).phone ?? "").trim();
  }
  return "";
}

function normalizeIndianPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length === 10) return digits;
  return "";
}

export async function createCashfreePaymentSession(
  orderNumber: string,
  checkoutEmail: string,
) {
  if (!cashfreeConfigured()) {
    throw new Error("Cashfree online payments are not configured yet.");
  }

  const prisma = getPrisma();
  const order = await prisma.order.findFirst({
    where: {
      orderNumber,
      user: { email: checkoutEmail.trim().toLowerCase() },
    },
    include: {
      user: {
        select: { id: true, email: true, name: true, phone: true },
      },
    },
  });

  if (!order) throw new Error("Order not found.");
  if (order.paymentMethod !== "cashfree") {
    throw new Error("This order is not configured for online payment.");
  }
  if (order.paymentStatus === "PAID") {
    throw new Error("This order is already paid.");
  }

  const existing = await getCashfreeOrder(order.orderNumber).catch(() => null);
  if (existing?.payment_session_id) {
    return {
      orderId: existing.order_id,
      paymentSessionId: existing.payment_session_id,
      mode: mode(),
    };
  }

  const appUrl = getPublicAppUrl();
  if (!/^https?:\/\//.test(appUrl)) {
    throw new Error("NEXT_PUBLIC_APP_URL must be configured before enabling Cashfree.");
  }

  const phone = normalizeIndianPhone(
    readShippingPhone(order.shippingAddress) || order.user.phone || "",
  );
  if (!phone) {
    throw new Error("A valid 10-digit Indian phone number is required for online payment.");
  }

  const returnUrl = `${appUrl}/checkout/payment-return?order_id={order_id}`;
  const publicWebhookAvailable =
    appUrl.startsWith("https://") &&
    !/\/\/(localhost|127\.0\.0\.1)(?::|\/|$)/i.test(appUrl);
  const notifyUrl = `${appUrl}/api/payments/cashfree/webhook`;

  const created = await cashfreeFetch<CashfreeOrderResponse>("/orders", {
    method: "POST",
    body: JSON.stringify({
      order_id: order.orderNumber,
      order_amount: Number((order.totalMinor / 100).toFixed(2)),
      order_currency: order.currency || "INR",
      customer_details: {
        customer_id: order.user.id,
        customer_name: order.user.name,
        customer_email: order.user.email,
        customer_phone: phone,
      },
      order_meta: {
        return_url: returnUrl,
        ...(publicWebhookAvailable ? { notify_url: notifyUrl } : {}),
      },
      order_note: `NEXORA order ${order.orderNumber}`,
      order_tags: {
        nexora_order_id: order.id,
      },
    }),
  });

  if (!created?.payment_session_id) {
    throw new Error("Cashfree did not return a payment session.");
  }

  return {
    orderId: created.order_id,
    paymentSessionId: created.payment_session_id,
    mode: mode(),
  };
}

export function verifyCashfreeWebhookSignature(
  rawBody: string,
  signature: string | null,
  timestamp: string | null,
) {
  if (!signature || !timestamp) return false;

  const { clientSecret } = credentials();
  const expected = createHmac("sha256", clientSecret)
    .update(`${timestamp}${rawBody}`)
    .digest("base64");

  const received = Buffer.from(signature);
  const calculated = Buffer.from(expected);
  if (received.length !== calculated.length) return false;

  return timingSafeEqual(received, calculated);
}

export async function syncCashfreePayment(orderNumber: string) {
  const prisma = getPrisma();
  const order = await prisma.order.findUnique({
    where: { orderNumber },
    select: {
      id: true,
      orderNumber: true,
      totalMinor: true,
      currency: true,
      paymentMethod: true,
      paymentStatus: true,
      status: true,
    },
  });

  if (!order) throw new Error("Local order not found.");
  if (order.paymentMethod !== "cashfree") {
    throw new Error("Order is not a Cashfree payment order.");
  }

  const payments = await getCashfreePayments(order.orderNumber);
  const successful = payments.find(
    (payment) => payment.payment_status === "SUCCESS",
  );
  const pending = payments.some(
    (payment) => payment.payment_status === "PENDING",
  );

  if (successful) {
    if (
      typeof successful.payment_amount === "number" &&
      Math.round(successful.payment_amount * 100) !== order.totalMinor
    ) {
      throw new Error("Cashfree payment amount does not match the local order.");
    }

    if (
      successful.payment_currency &&
      successful.payment_currency !== order.currency
    ) {
      throw new Error("Cashfree payment currency does not match the local order.");
    }

    if (order.paymentStatus !== "PAID") {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: "PAID",
          ...(order.status === "PENDING" ? { status: "CONFIRMED" as const } : {}),
        },
      });
    }

    return {
      state: "SUCCESS" as const,
      paymentStatus: "PAID" as const,
      orderStatus: order.status === "PENDING" ? "CONFIRMED" : order.status,
      cfPaymentId: successful.cf_payment_id ? String(successful.cf_payment_id) : null,
    };
  }

  if (pending) {
    return {
      state: "PENDING" as const,
      paymentStatus: order.paymentStatus,
      orderStatus: order.status,
      cfPaymentId: null,
    };
  }

  if (payments.length && order.paymentStatus !== "PAID") {
    await prisma.order.update({
      where: { id: order.id },
      data: { paymentStatus: "FAILED" },
    });
  }

  return {
    state: payments.length ? ("FAILED" as const) : ("PENDING" as const),
    paymentStatus: payments.length ? ("FAILED" as const) : order.paymentStatus,
    orderStatus: order.status,
    cfPaymentId: null,
  };
}
