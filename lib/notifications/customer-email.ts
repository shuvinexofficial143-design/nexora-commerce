import { getPrisma } from "@/lib/db/prisma";
import { getPublicAppUrl } from "@/lib/config/runtime";

type OrderEmailEvent =
  | "ORDER_RECEIVED"
  | "PAYMENT_CONFIRMED"
  | "CONFIRMED"
  | "PROCESSING"
  | "PACKED"
  | "SHIPPED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED";

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function config() {
  return {
    apiKey: process.env.RESEND_API_KEY?.trim() ?? "",
    from: process.env.ORDER_EMAIL_FROM?.trim() ?? "",
    replyTo: process.env.ORDER_SUPPORT_EMAIL?.trim() ?? "",
  };
}

export function customerEmailConfigured() {
  const { apiKey, from } = config();
  return Boolean(apiKey && from);
}

function eventCopy(event: OrderEmailEvent, orderNumber: string) {
  const readable = orderNumber;

  switch (event) {
    case "ORDER_RECEIVED":
      return {
        subject: `Order ${readable} received · NEXORA`,
        heading: "We received your order",
        message:
          "Your order is in our system. We will update you as it moves through fulfilment.",
      };
    case "PAYMENT_CONFIRMED":
      return {
        subject: `Payment confirmed for ${readable} · NEXORA`,
        heading: "Payment confirmed",
        message:
          "Your online payment has been verified and your order is confirmed.",
      };
    case "CONFIRMED":
      return {
        subject: `Order ${readable} confirmed · NEXORA`,
        heading: "Order confirmed",
        message: "Your order has been confirmed and is ready for processing.",
      };
    case "PROCESSING":
      return {
        subject: `Order ${readable} is processing · NEXORA`,
        heading: "We are preparing your order",
        message: "Your order is now being processed.",
      };
    case "PACKED":
      return {
        subject: `Order ${readable} packed · NEXORA`,
        heading: "Your order is packed",
        message: "Your order has been packed and is getting ready to ship.",
      };
    case "SHIPPED":
      return {
        subject: `Order ${readable} shipped · NEXORA`,
        heading: "Your order has shipped",
        message: "Your order has left fulfilment and is on its way.",
      };
    case "OUT_FOR_DELIVERY":
      return {
        subject: `Order ${readable} is out for delivery · NEXORA`,
        heading: "Out for delivery",
        message: "Your order is with the delivery partner for final delivery.",
      };
    case "DELIVERED":
      return {
        subject: `Order ${readable} delivered · NEXORA`,
        heading: "Delivered",
        message: "Your order has been marked as delivered. Thank you for shopping with NEXORA.",
      };
    case "CANCELLED":
      return {
        subject: `Order ${readable} cancelled · NEXORA`,
        heading: "Order cancelled",
        message:
          "Your order has been cancelled. If a paid order is eligible for a refund, it will be handled according to the refund policy.",
      };
  }
}

async function orderSnapshot(orderId: string) {
  return getPrisma().order.findUnique({
    where: { id: orderId },
    include: {
      user: {
        select: { name: true, email: true },
      },
      items: {
        select: {
          productName: true,
          quantity: true,
          totalMinor: true,
        },
      },
    },
  });
}

async function sendViaResend(input: {
  to: string;
  subject: string;
  html: string;
  text: string;
}) {
  const { apiKey, from, replyTo } = config();

  if (!apiKey || !from) {
    return { sent: false as const, reason: "not_configured" as const };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: input.subject,
      html: input.html,
      text: input.text,
      ...(replyTo ? { reply_to: replyTo } : {}),
    }),
  });

  const payload = (await response.json().catch(() => null)) as
    | { id?: string; message?: string; error?: { message?: string } }
    | null;

  if (!response.ok) {
    throw new Error(
      payload?.message ||
        payload?.error?.message ||
        `Email provider returned HTTP ${response.status}.`,
    );
  }

  return { sent: true as const, id: payload?.id ?? null };
}

export async function sendOrderEmail(orderId: string, event: OrderEmailEvent) {
  const order = await orderSnapshot(orderId);
  if (!order) return { sent: false as const, reason: "order_not_found" as const };

  const copy = eventCopy(event, order.orderNumber);
  const appUrl = getPublicAppUrl();
  const trackUrl = `${appUrl}/track-order`;
  const itemRows = order.items
    .map(
      (item) =>
        `<tr><td style="padding:8px 0">${escapeHtml(item.productName)} × ${item.quantity}</td><td style="padding:8px 0;text-align:right">${escapeHtml(currency.format(item.totalMinor / 100))}</td></tr>`,
    )
    .join("");

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;color:#171714">
      <div style="background:#171714;color:white;padding:24px;border-radius:20px 20px 0 0">
        <div style="font-size:22px;font-weight:800">NEXORA.</div>
      </div>
      <div style="padding:28px;border:1px solid #e8e8e2;border-top:0;border-radius:0 0 20px 20px">
        <p style="margin:0 0 8px;color:#777;font-size:12px;font-weight:700;text-transform:uppercase">Order ${escapeHtml(order.orderNumber)}</p>
        <h1 style="font-size:28px;margin:0 0 12px">${escapeHtml(copy.heading)}</h1>
        <p style="line-height:1.6;color:#555">${escapeHtml(copy.message)}</p>
        <table style="width:100%;border-collapse:collapse;margin:22px 0;border-top:1px solid #eee;border-bottom:1px solid #eee">
          ${itemRows}
        </table>
        <div style="display:flex;justify-content:space-between;font-weight:800;font-size:18px">
          <span>Total</span><span>${escapeHtml(currency.format(order.totalMinor / 100))}</span>
        </div>
        <p style="margin:22px 0 0;color:#666;font-size:13px;line-height:1.6">
          Track the order at <a href="${escapeHtml(trackUrl)}">${escapeHtml(trackUrl)}</a> using this order number and ${escapeHtml(order.user.email)}.
        </p>
      </div>
    </div>
  `;

  const text = [
    "NEXORA",
    copy.heading,
    copy.message,
    `Order: ${order.orderNumber}`,
    ...order.items.map(
      (item) =>
        `${item.productName} x ${item.quantity} — ${currency.format(item.totalMinor / 100)}`,
    ),
    `Total: ${currency.format(order.totalMinor / 100)}`,
    `Track: ${trackUrl}`,
  ].join("\n");

  return sendViaResend({
    to: order.user.email,
    subject: copy.subject,
    html,
    text,
  });
}

export async function sendOrderEmailSafe(
  orderId: string,
  event: OrderEmailEvent,
) {
  try {
    return await sendOrderEmail(orderId, event);
  } catch (error) {
    console.error("NEXORA customer email failed", {
      orderId,
      event,
      error,
    });
    return { sent: false as const, reason: "provider_error" as const };
  }
}
