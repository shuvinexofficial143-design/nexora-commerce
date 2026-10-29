import { createHmac, timingSafeEqual } from "node:crypto";
import { getPrisma } from "@/lib/db/prisma";
import { getPublicAppUrl } from "@/lib/config/runtime";
import { notify } from "@/lib/admin/notifications";
import { sendOrderEmailSafe } from "@/lib/notifications/customer-email";

const API_VERSION = process.env.CASHFREE_API_VERSION?.trim() || "2025-01-01";

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

export type CashfreeRefund = {
  cf_payment_id?: string | number;
  cf_refund_id?: string | number;
  refund_id: string;
  order_id: string;
  refund_amount: number;
  refund_currency?: string;
  refund_note?: string;
  refund_status:
    | "SUCCESS"
    | "PENDING"
    | "CANCELLED"
    | "ONHOLD"
    | "FAILED"
    | string;
  status_description?: string;
  refund_arn?: string;
  created_at?: string;
  processed_at?: string;
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

function cashfreeRefundId(returnId: string) {
  const compact = returnId.replace(/[^A-Za-z0-9]/g, "");
  return `NXR${compact}`.slice(0, 40);
}

export async function getCashfreeRefund(
  orderNumber: string,
  returnId: string,
) {
  const refundId = cashfreeRefundId(returnId);
  return cashfreeFetch<CashfreeRefund>(
    `/orders/${encodeURIComponent(orderNumber)}/refunds/${encodeURIComponent(refundId)}`,
    { method: "GET" },
    true,
  );
}

export async function createOrGetCashfreeRefund(input: {
  orderNumber: string;
  returnId: string;
  amountMinor: number;
  note?: string;
}) {
  if (!cashfreeConfigured()) {
    throw new Error("Cashfree refund is not configured yet.");
  }

  if (
    !Number.isInteger(input.amountMinor) ||
    input.amountMinor <= 0
  ) {
    throw new Error("Refund amount must be greater than zero.");
  }

  const existing = await getCashfreeRefund(
    input.orderNumber,
    input.returnId,
  ).catch(() => null);

  if (existing) return existing;

  const refundId = cashfreeRefundId(input.returnId);
  const rawNote = input.note?.trim() || "NEXORA return refund";
  const refundNote =
    rawNote.length < 3
      ? "NEXORA return refund"
      : rawNote.slice(0, 100);

  const created = await cashfreeFetch<
    CashfreeRefund | CashfreeRefund[]
  >(
    `/orders/${encodeURIComponent(input.orderNumber)}/refunds`,
    {
      method: "POST",
      headers: {
        "x-idempotency-key": input.returnId,
      },
      body: JSON.stringify({
        refund_amount: Number((input.amountMinor / 100).toFixed(2)),
        refund_id: refundId,
        refund_note: refundNote,
        refund_speed: "STANDARD",
      }),
    },
  );

  const refund = Array.isArray(created) ? created[0] : created;
  if (!refund) {
    throw new Error("Cashfree did not return a refund record.");
  }

  return refund;
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
  if (["CANCELLED","RETURN_REQUESTED","RETURNED","REFUNDED"].includes(order.status)) {
    throw new Error("This order is closed. Online payment cannot be started.");
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


/** Bank-provided success data must contain a complete auditable INR amount,
 * currency and gateway payment identifier. Missing values never imply paid.
 */
export function verifySuccessfulCashfreePayment(
  payment: CashfreePayment,
  order: { totalMinor:number; currency:string },
) {
  const amount=payment.payment_amount;
  if (typeof amount!=="number"||!Number.isFinite(amount)||amount<=0||
      !Number.isSafeInteger(order.totalMinor)||order.totalMinor<=0) {
    throw new Error("Cashfree successful payment is missing a valid amount.");
  }
  const paise=amount*100;
  const rounded=Math.round(paise);
  if(!Number.isSafeInteger(rounded)||Math.abs(paise-rounded)>0.000001||
     rounded!==order.totalMinor)
    throw new Error("Cashfree payment amount does not match the local order.");
  if(!payment.payment_currency||payment.payment_currency!==order.currency||
     order.currency!=="INR")
    throw new Error("Cashfree payment currency does not match the local order.");
  const id=payment.cf_payment_id;
  if((typeof id!=="number"&&typeof id!=="string")||
     !String(id).trim()||String(id).length>100)
    throw new Error("Cashfree successful payment has no valid gateway identifier.");
  return String(id);
}

const paymentManualReviewStatuses=new Set([
  "CANCELLED","RETURN_REQUESTED","RETURNED","REFUNDED",
]);

/** Fetch signed-provider API state BEFORE locking the local order. Lock the
 * Order row during reconciliation so webhook + return-page status requests
 * cannot each generate a second paid event, nor resurrect cancelled orders.
 */
export async function syncCashfreePayment(orderNumber: string) {
  const prisma=getPrisma();
  const candidate=await prisma.order.findUnique({
    where:{orderNumber},select:{id:true,paymentMethod:true},
  });
  if(!candidate)throw new Error("Local order not found.");
  if(candidate.paymentMethod!=="cashfree")
    throw new Error("Order is not a Cashfree payment order.");

  const payments=await getCashfreePayments(orderNumber);
  const settled=await prisma.$transaction(async tx=>{
    const locked=await tx.$queryRawUnsafe<Array<{id:string}>>(
      'SELECT "id" FROM "Order" WHERE "id" = $1 FOR UPDATE',candidate.id,
    );
    if(locked.length!==1)throw new Error("Local order not found.");
    const order=await tx.order.findUniqueOrThrow({where:{id:candidate.id},select:{
      id:true,orderNumber:true,totalMinor:true,currency:true,paymentMethod:true,
      paymentStatus:true,status:true,
    }});
    if(order.paymentMethod!=="cashfree")
      throw new Error("Order is not a Cashfree payment order.");
    const success=payments.find(payment=>payment.payment_status==="SUCCESS");
    if(success){
      const cfPaymentId=verifySuccessfulCashfreePayment(success,order);
      if(order.paymentStatus==="PAID")
        return {state:"SUCCESS" as const,paymentStatus:"PAID" as const,
          orderStatus:order.status,cfPaymentId,changedToPaid:false,manualReview:false};
      const manualReview=paymentManualReviewStatuses.has(order.status);
      const confirmed=order.status==="PENDING"?"CONFIRMED" as const:order.status;
      await tx.order.update({where:{id:order.id},data:{
        paymentStatus:"PAID",...(order.status==="PENDING"?{status:"CONFIRMED" as const}:{}),
      }});
      return {state:"SUCCESS" as const,paymentStatus:"PAID" as const,
        orderStatus:confirmed,cfPaymentId,changedToPaid:true,manualReview};
    }
    // A previously verified paid order must NEVER regress to FAILED because
    // the payment provider returns stale or incomplete events.
    if(order.paymentStatus==="PAID"){
      return {state:"SUCCESS" as const,paymentStatus:"PAID" as const,
        orderStatus:order.status,cfPaymentId:null,changedToPaid:false,manualReview:false};
    }
    const pending=payments.some(payment=>payment.payment_status==="PENDING");
    if(pending||!payments.length){
      return {state:"PENDING" as const,paymentStatus:order.paymentStatus,
        orderStatus:order.status,cfPaymentId:null,changedToPaid:false,manualReview:false};
    }
    if(order.paymentStatus==="FAILED")
      return {state:"FAILED" as const,paymentStatus:"FAILED" as const,
        orderStatus:order.status,cfPaymentId:null,changedToPaid:false,manualReview:false};
    await tx.order.update({where:{id:order.id},data:{paymentStatus:"FAILED"}});
    return {state:"FAILED" as const,paymentStatus:"FAILED" as const,
      orderStatus:order.status,cfPaymentId:null,changedToPaid:false,manualReview:false,
      changedToFailed:true};
  },{maxWait:10000,timeout:15000});

  // External notifications happen ONLY for the winning committed transition,
  // never for duplicate webhooks or a concurrent status poll.
  if(settled.changedToPaid){
    await Promise.allSettled([
      ...(settled.manualReview ? [] : [sendOrderEmailSafe(candidate.id,"PAYMENT_CONFIRMED")]),
      notify({
        type:settled.manualReview?"PAYMENT_PAID_REVIEW":"PAYMENT_PAID",
        title:settled.manualReview?"Payment after terminal order needs review":"Online payment confirmed",
        message:settled.manualReview
          ? orderNumber+" received payment after cancellation/return. Review refund manually."
          :orderNumber+" was paid successfully through Cashfree",
        entityType:"ORDER",entityId:candidate.id,
        severity:settled.manualReview?"WARNING":"SUCCESS",
      }),
    ]);
  }else if("changedToFailed" in settled&&settled.changedToFailed){
    await Promise.allSettled([notify({
      type:"PAYMENT_FAILED",title:"Online payment failed",
      message:orderNumber+" has no successful Cashfree payment",
      entityType:"ORDER",entityId:candidate.id,severity:"WARNING",
    })]);
  }

  return {
    state:settled.state,paymentStatus:settled.paymentStatus,
    orderStatus:settled.orderStatus,cfPaymentId:settled.cfPaymentId,
  };
}
