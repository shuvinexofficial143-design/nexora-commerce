import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, test } from "node:test";
import { getPrisma } from "../../lib/db/prisma";
import {
  findTrackedOrder, requestTrackingChallenge, verifyTrackingChallenge,
} from "../../lib/orders/secure-tracking";

function verifyIsolation() {
  if (process.env.NEXORA_QA_ALLOW_DB_INTEGRATION !== "true") throw new Error("Explicit isolated QA opt-in required");
  for (const key of ["DATABASE_URL", "DIRECT_URL"]) {
    const u = new URL(process.env[key] || "");
    if (!["127.0.0.1", "localhost", "::1", "[::1]"].includes(u.hostname)
      || u.pathname !== "/nexora_qa" || u.username !== "nexora_qa") {
      throw new Error("Tracking QA integration refuses production or non-local database");
    }
  }
  if (!process.env.ORDER_TRACKING_SECRET || process.env.ORDER_TRACKING_SECRET.length < 32) {
    throw new Error("Isolated tracking test signing secret is missing");
  }
}
verifyIsolation();
const db = getPrisma();

async function fixture() {
  const marker = randomUUID().replaceAll("-", "").slice(0, 12).toUpperCase();
  const email = `track-${marker.toLowerCase()}@example.invalid`;
  const user = await db.user.create({ data: { email, name: "QA Customer", passwordHash: "qa-not-for-login" } });
  const product = await db.product.create({
    data: { slug: `track-${marker.toLowerCase()}`, sku: `TRK-${marker}`,
      name: "QA Tracking Product", priceMinor: 50000, description: "Disposable QA item", status: "ACTIVE" },
  });
  const order = await db.order.create({
    data: {
      userId: user.id, orderNumber: `NX-20261021-${marker.slice(0, 8)}`,
      subtotalMinor: 50000, totalMinor: 59900, shippingMinor: 9900, taxMinor: 0,
      paymentMethod: "cod",
      shippingAddress: { fullName: "QA Customer", line1: "Test address", city: "Indore",
        state: "MP", postalCode: "452001", phone: "9876543210" },
      items: { create: [{ productId: product.id, productName: product.name,
        sku: product.sku, quantity: 1, unitPriceMinor: 50000, totalMinor: 50000 }] },
    },
  });
  return { email, user, product, order };
}
before(async () => { await db.$connect(); });
after(async () => { await db.$disconnect(); });

test("real stored order requires delivered code; only verified bearer token reveals address and items", async () => {
  const f = await fixture();
  let sent = "";
  let destination = "";
  const request = await requestTrackingChallenge({
    orderNumber: f.order.orderNumber, email: f.email,
  }, async (message) => {
    sent = message.text;
    destination = message.to;
    return { sent: true as const, id: "isolated-mock" };
  });
  assert.equal(destination, f.email);
  assert.match(sent, /Expires in 10 minutes/);
  const code = sent.match(/Use code ([0-9]{6})/)?.[1];
  assert.ok(code);
  assert.equal(await findTrackedOrder("nonexistent"), null);
  assert.equal(await verifyTrackingChallenge({ challengeId: request.challengeId, code: "not-otp" }).catch(() => null), null);
  const verified = await verifyTrackingChallenge({ challengeId: request.challengeId, code });
  assert.ok(verified?.accessToken);
  const details = await findTrackedOrder(verified.accessToken);
  assert.equal(details?.orderNumber, f.order.orderNumber);
  assert.equal(details?.shippingAddress.line1, "Test address");
  assert.equal(details?.shippingAddress.phone, undefined, "Never return checkout phone number");
  assert.equal(details?.items[0].quantity, 1);
  assert.equal(details?.paymentMethod, "cod");
  assert.equal(details?.timeline.length, 2);
  assert.equal(await verifyTrackingChallenge({ challengeId: request.challengeId, code }), null,
    "A used OTP must never issue a second bearer token");
  const count = await db.orderTrackingChallenge.count({ where: { orderId: f.order.id } });
  assert.equal(count, 1);
});

test("unknown order or incorrect checkout email cannot send codes or reveal existence", async () => {
  const f = await fixture();
  let sends = 0;
  const sender = async () => { sends++; return { sent: true as const, id: "qa" }; };
  const wrongEmail = await requestTrackingChallenge({ orderNumber: f.order.orderNumber, email: "other@example.invalid" }, sender);
  const notFound = await requestTrackingChallenge({ orderNumber: "NX-20261021-FFFFFFFF", email: f.email }, sender);
  assert.equal(wrongEmail.accepted, true);
  assert.equal(notFound.accepted, true);
  assert.equal(sends, 0);
  assert.equal(await verifyTrackingChallenge({ challengeId: wrongEmail.challengeId, code: "123456" }), null);
  assert.equal(await verifyTrackingChallenge({ challengeId: notFound.challengeId, code: "123456" }), null);
});

test("five incorrect codes lock a challenge and expire access tokens server-side", async () => {
  const f = await fixture();
  let sentCode = "";
  const request = await requestTrackingChallenge({ orderNumber: f.order.orderNumber, email: f.email }, async (message) => {
    sentCode = message.text.match(/Use code ([0-9]{6})/)?.[1] || "";
    return { sent: true as const, id: "qa" };
  });
  assert.ok(sentCode);
  const incorrect = sentCode === "999999" ? "888888" : "999999";
  for (let i = 0; i < 5; i++) {
    assert.equal(await verifyTrackingChallenge({ challengeId: request.challengeId, code: incorrect }), null);
  }
  assert.equal(await verifyTrackingChallenge({ challengeId: request.challengeId, code: sentCode }), null);
  const stored = await db.orderTrackingChallenge.findUniqueOrThrow({ where: { id: request.challengeId } });
  assert.equal(stored.attempts, 5);

  await db.orderTrackingChallenge.update({ where: { id: request.challengeId },
    data: { attempts: 0, expiresAt: new Date(Date.now() - 1000) } });
  assert.equal(await verifyTrackingChallenge({ challengeId: request.challengeId, code: sentCode }), null);
});

test("short-lived access expires and recent challenge prevents repeated email sends", async () => {
  const f = await fixture();
  let sentCode = "";
  let sendCount = 0;
  const sender = async (message: { text: string }) => {
    sentCode = message.text.match(/Use code ([0-9]{6})/)?.[1] || "";
    sendCount++;
    return { sent: true as const, id: "qa" };
  };
  const first = await requestTrackingChallenge({ orderNumber: f.order.orderNumber, email: f.email }, sender);
  const repeated = await requestTrackingChallenge({ orderNumber: f.order.orderNumber, email: f.email }, sender);
  assert.equal(sendCount, 1);
  assert.notEqual(first.challengeId, repeated.challengeId);
  const verified = await verifyTrackingChallenge({ challengeId: first.challengeId, code: sentCode });
  assert.ok(verified);
  await db.orderTrackingChallenge.update({ where: { id: first.challengeId },
    data: { accessExpiresAt: new Date(Date.now() - 1000) } });
  assert.equal(await findTrackedOrder(verified.accessToken), null);
});
