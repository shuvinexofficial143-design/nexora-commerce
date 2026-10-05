const RESEND_ENDPOINT = "https://api.resend.com/emails";

type EmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
  idempotencyKey: string;
};

function configured() {
  return Boolean(
    process.env.RESEND_API_KEY?.trim() &&
      process.env.EMAIL_FROM?.trim(),
  );
}

function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[char] ?? char,
  );
}

function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function customerEmailConfigured() {
  return configured();
}

export async function sendTransactionalEmail(input: EmailInput) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();
  const replyTo = process.env.EMAIL_REPLY_TO?.trim();

  if (!apiKey || !from) {
    return { sent: false as const, reason: "not-configured" as const };
  }

  if (!validEmail(input.to)) {
    return { sent: false as const, reason: "invalid-recipient" as const };
  }

  const response = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": input.idempotencyKey.slice(0, 256),
    },
    body: JSON.stringify({
      from,
      to: [input.to.trim().toLowerCase()],
      subject: input.subject,
      html: input.html,
      text: input.text,
      ...(replyTo ? { reply_to: replyTo } : {}),
    }),
  });

  const payload = (await response.json().catch(() => null)) as
    | { id?: string; message?: string; name?: string }
    | null;

  if (!response.ok) {
    throw new Error(
      payload?.message ||
        `Email provider returned HTTP ${response.status}.`,
    );
  }

  return {
    sent: true as const,
    id: payload?.id ?? null,
  };
}

function brandShell(title: string, body: string) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;color:#11110f">
      <div style="font-size:24px;font-weight:900;margin-bottom:24px">NEXORA.</div>
      <h1 style="font-size:28px;line-height:1.15;margin:0 0 16px">${escapeHtml(title)}</h1>
      ${body}
      <p style="margin-top:28px;font-size:12px;line-height:1.6;color:#777">
        This is an automated transactional message about your Nexora order.
      </p>
    </div>
  `;
}

export async function sendOrderConfirmationEmail(input: {
  to: string;
  customerName: string;
  orderNumber: string;
  totalMinor: number;
  paymentMethod: string | null;
}) {
  const customer = escapeHtml(input.customerName || "Customer");
  const order = escapeHtml(input.orderNumber);
  const total = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(input.totalMinor / 100);
  const payment =
    input.paymentMethod === "cashfree"
      ? "Online payment"
      : "Cash on Delivery";

  const title = `Order ${input.orderNumber} received`;
  const text =
    `Hi ${input.customerName || "Customer"},\n\n` +
    `We received your Nexora order ${input.orderNumber}.\n` +
    `Total: ${total}\nPayment: ${payment}\n\n` +
    "Keep your order number to track or contact support.";

  return sendTransactionalEmail({
    to: input.to,
    subject: `Nexora order confirmed · ${input.orderNumber}`,
    idempotencyKey: `order-confirmed/${input.orderNumber}`,
    text,
    html: brandShell(
      title,
      `
        <p style="font-size:15px;line-height:1.7">Hi ${customer}, we received your order.</p>
        <div style="background:#f5f5f1;border-radius:18px;padding:18px;margin:20px 0">
          <p style="margin:0 0 8px"><strong>Order:</strong> ${order}</p>
          <p style="margin:0 0 8px"><strong>Total:</strong> ${escapeHtml(total)}</p>
          <p style="margin:0"><strong>Payment:</strong> ${escapeHtml(payment)}</p>
        </div>
        <p style="font-size:14px;line-height:1.7;color:#555">
          Keep this order number. You can use it with your checkout email on the Track Order page.
        </p>
      `,
    ),
  });
}

export async function sendOrderStatusEmail(input: {
  to: string;
  customerName: string;
  orderNumber: string;
  status: string;
}) {
  const readable = input.status.replaceAll("_", " ").toLowerCase();
  const customer = escapeHtml(input.customerName || "Customer");
  const order = escapeHtml(input.orderNumber);
  const status = escapeHtml(readable);

  return sendTransactionalEmail({
    to: input.to,
    subject: `Nexora order update · ${input.orderNumber}`,
    idempotencyKey: `order-status/${input.orderNumber}/${input.status}`,
    text:
      `Hi ${input.customerName || "Customer"},\n\n` +
      `Your order ${input.orderNumber} is now ${readable}.\n\n` +
      "Use your order number and checkout email on Track Order for the latest status.",
    html: brandShell(
      `Your order is now ${readable}`,
      `
        <p style="font-size:15px;line-height:1.7">Hi ${customer}, your order status has changed.</p>
        <div style="background:#f5f5f1;border-radius:18px;padding:18px;margin:20px 0">
          <p style="margin:0 0 8px"><strong>Order:</strong> ${order}</p>
          <p style="margin:0"><strong>Status:</strong> ${status}</p>
        </div>
      `,
    ),
  });
}

export async function tryCustomerEmail(
  action: () => Promise<unknown>,
  context: string,
) {
  try {
    await action();
  } catch (error) {
    console.error(`NEXORA customer email failed (${context})`, error);
  }
}
