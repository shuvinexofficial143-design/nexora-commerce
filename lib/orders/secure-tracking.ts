import { createHash, createHmac, randomBytes, randomInt, randomUUID, timingSafeEqual } from "node:crypto";
import { getPrisma } from "@/lib/db/prisma";
import { customerEmailConfigured, sendViaResend } from "@/lib/notifications/customer-email";

const ORDER_PATTERN = /^NX-[0-9]{8}-[A-Z0-9]{8}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CODE_PATTERN = /^[0-9]{6}$/;
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{40,100}$/;
const CHALLENGE_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CHALLENGE_MS = 10 * 60_000;
const ACCESS_MS = 30 * 60_000;
const MAX_ATTEMPTS = 5;

export class TrackingUnavailableError extends Error {}
export class TrackingInputError extends Error {}

type Address = {
  fullName?: string; line1?: string; line2?: string; city?: string;
  state?: string; postalCode?: string; country?: string;
};
export function validateTrackingIdentity(input: { orderNumber?: unknown; email?: unknown }) {
  const orderNumber = String(input.orderNumber ?? "").trim().toUpperCase();
  const email = String(input.email ?? "").trim().toLowerCase();
  if (!ORDER_PATTERN.test(orderNumber) || email.length > 254 || !EMAIL_PATTERN.test(email)) {
    throw new TrackingInputError("Enter a valid order number and checkout email.");
  }
  return { orderNumber, email };
}
export function validateTrackingCode(input: { challengeId?: unknown; code?: unknown }) {
  const challengeId = String(input.challengeId ?? "");
  const code = String(input.code ?? "").trim();
  if (!CHALLENGE_PATTERN.test(challengeId) || !CODE_PATTERN.test(code)) {
    throw new TrackingInputError("Enter the six-digit verification code.");
  }
  return { challengeId, code };
}
export function trackingConfigured() {
  return customerEmailConfigured() && (process.env.ORDER_TRACKING_SECRET?.length ?? 0) >= 32;
}
function signingKey() {
  if (!trackingConfigured()) throw new TrackingUnavailableError("Secure email verification is not configured.");
  return process.env.ORDER_TRACKING_SECRET!;
}
export function hashAccessToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
function hashCode(challengeId: string, code: string) {
  return createHmac("sha256", signingKey()).update(challengeId + ":" + code).digest("hex");
}
export function normalizeTrackingToken(value: string | null) {
  if (!value || !value.startsWith("Bearer ")) return null;
  const token = value.slice(7);
  return TOKEN_PATTERN.test(token) ? token : null;
}
export function orderTrackingGuidance(status: string) {
  if (["PENDING", "CONFIRMED", "PROCESSING", "PACKED"].includes(status)) {
    return {
      cancellation: "Contact support promptly to request cancellation; approval depends on dispatch status.",
      returns: "Return requests are reviewed after shipment or delivery and are not yet available.",
    };
  }
  if (["SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"].includes(status)) {
    return {
      cancellation: "Dispatch is recorded. Contact support for available options.",
      returns: "You may request a return review, subject to the product and order policy.",
    };
  }
  return {
    cancellation: "Contact support for any changes to this order.",
    returns: "Contact support to check any available return or refund options.",
  };
}

type SendVerification = typeof sendViaResend;

export async function requestTrackingChallenge(
  raw: { orderNumber?: unknown; email?: unknown },
  send: SendVerification = sendViaResend,
) {
  const { orderNumber, email } = validateTrackingIdentity(raw);
  signingKey();
  const prisma = getPrisma();
  // Never reveal whether an order exists. The same outward response is used
  // for absent, mismatched, and cooldown-limited lookups.
  const generic = () => ({ challengeId: randomUUID(), accepted: true as const });
  const order = await prisma.order.findFirst({
    where: { orderNumber, user: { email } },
    select: { id: true, orderNumber: true },
  });
  if (!order) return generic();

  const recent = await prisma.orderTrackingChallenge.findFirst({
    where: { orderId: order.id, createdAt: { gt: new Date(Date.now() - 60_000) } },
    select: { id: true },
  });
  if (recent) return generic();

  const challengeId = randomUUID();
  const code = randomInt(0, 1_000_000).toString().padStart(6, "0");
  await prisma.orderTrackingChallenge.create({
    data: {
      id: challengeId, orderId: order.id, codeHash: hashCode(challengeId, code),
      expiresAt: new Date(Date.now() + CHALLENGE_MS),
    },
  });
  try {
    const result = await send({
      to: email,
      subject: "Your NEXORA order verification code",
      text: `Use code ${code} to view order ${order.orderNumber}. Expires in 10 minutes. If you did not request this, ignore this email.`,
      html: `<div style="font-family:Arial,sans-serif;max-width:540px;margin:auto;padding:28px"><h2>NEXORA order verification</h2><p>Your one-time code for order tracking is:</p><p style="font-size:34px;font-weight:800;letter-spacing:8px">${code}</p><p>Expires in 10 minutes. If you did not request this, ignore this message.</p></div>`,
    });
    if (!result.sent) throw new TrackingUnavailableError("Verification email service is unavailable.");
  } catch {
    await prisma.orderTrackingChallenge.deleteMany({ where: { id: challengeId } });
    throw new TrackingUnavailableError("Verification email could not be sent. Please try again later.");
  }
  return { challengeId, accepted: true as const };
}

export async function verifyTrackingChallenge(raw: { challengeId?: unknown; code?: unknown }) {
  const { challengeId, code } = validateTrackingCode(raw);
  signingKey();
  const prisma = getPrisma();
  const now = new Date();
  // One failed OR successful code submission consumes one attempt atomically.
  const claimed = await prisma.orderTrackingChallenge.updateMany({
    where: { id: challengeId, verifiedAt: null, expiresAt: { gt: now }, attempts: { lt: MAX_ATTEMPTS } },
    data: { attempts: { increment: 1 } },
  });
  if (claimed.count !== 1) return null;
  const challenge = await prisma.orderTrackingChallenge.findUnique({ where: { id: challengeId } });
  if (!challenge) return null;
  const expected = Buffer.from(challenge.codeHash, "hex");
  const supplied = Buffer.from(hashCode(challengeId, code), "hex");
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return null;

  const accessToken = randomBytes(32).toString("base64url");
  const completed = await prisma.orderTrackingChallenge.updateMany({
    where: { id: challengeId, verifiedAt: null, expiresAt: { gt: new Date() } },
    data: {
      verifiedAt: new Date(),
      accessTokenHash: hashAccessToken(accessToken),
      accessExpiresAt: new Date(Date.now() + ACCESS_MS),
    },
  });
  return completed.count === 1 ? { accessToken, expiresInSeconds: ACCESS_MS / 1000 } : null;
}

function safeAddress(input: unknown): Address {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};
  const record = input as Record<string, unknown>;
  const result: Record<string, string> = {};
  for (const key of ["fullName", "line1", "line2", "city", "state", "postalCode", "country"]) {
    if (typeof record[key] === "string") result[key] = record[key].slice(0, 200) as string;
  }
  return result;
}

export async function findTrackedOrder(token: string) {
  if (!TOKEN_PATTERN.test(token)) return null;
  const prisma = getPrisma();
  const challenge = await prisma.orderTrackingChallenge.findFirst({
    where: {
      accessTokenHash: hashAccessToken(token),
      verifiedAt: { not: null },
      accessExpiresAt: { gt: new Date() },
    },
    select: { orderId: true },
  });
  if (!challenge) return null;
  const order = await prisma.order.findUnique({
    where: { id: challenge.orderId },
    select: {
      orderNumber: true, status: true, paymentStatus: true, paymentMethod: true,
      subtotalMinor: true, discountMinor: true, shippingMinor: true, taxMinor: true, totalMinor: true,
      createdAt: true, updatedAt: true, shippingAddress: true,
      items: { select: { productName: true, quantity: true, totalMinor: true } },
    },
  });
  if (!order) return null;
  return {
    orderNumber: order.orderNumber,
    status: order.status,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    subtotalMinor: order.subtotalMinor,
    discountMinor: order.discountMinor,
    shippingMinor: order.shippingMinor,
    taxMinor: order.taxMinor,
    totalMinor: order.totalMinor,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    shippingAddress: safeAddress(order.shippingAddress),
    items: order.items,
    guidance: orderTrackingGuidance(order.status),
    // Only record facts that exist; never synthesize courier events or delivery ETAs.
    timeline: [
      { title: "Order placed", at: order.createdAt.toISOString() },
      { title: `Current order status: ${order.status.replaceAll("_", " ")}`, at: order.updatedAt.toISOString() },
    ],
  };
}
