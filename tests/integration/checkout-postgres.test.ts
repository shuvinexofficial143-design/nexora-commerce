import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, test } from "node:test";
import { getPrisma } from "../../lib/db/prisma";
import { createOrder, createOrderWithOutcome } from "../../lib/db/orders";
import { recoverCompletedCheckoutAttempt } from "../../lib/commerce/checkout-attempt-recovery";
import { POST as recoverRoute } from "../../app/api/backend/orders/recover/route";
import { resolveCoupon, recordCouponRedemption } from "../../lib/commerce/coupon-engine";
import { validateOrder } from "../../lib/server/backend";
import type { CreateOrderPayload } from "../../types/backend";

// This file ONLY executes via the isolated GitHub Actions PostgreSQL job.
// No production credentials, external services, or production seed scripts are used.
function verifyIsolation() {
  if (process.env.NEXORA_QA_ALLOW_DB_INTEGRATION !== "true") throw new Error("QA database integration opt-in is missing");
  const u = new URL(process.env.DATABASE_URL || "");
  const direct = new URL(process.env.DIRECT_URL || "");
  for (const candidate of [u, direct]) {
    if (!["127.0.0.1", "localhost", "::1", "[::1]"].includes(candidate.hostname)
        || candidate.pathname !== "/nexora_qa"
        || candidate.username !== "nexora_qa") {
      throw new Error("QA integration refuses non-local database URL or unexpected database identity");
    }
  }
}
verifyIsolation();
const db = getPrisma();
const suffix = () => randomUUID().replaceAll("-", "").slice(0, 12);

async function fixture(onHand = 5) {
  const id = suffix();
  const user = await db.user.create({ data: { email: `qa-${id}@example.invalid`, name: "QA only", passwordHash: "qa-never-login" } });
  const product = await db.product.create({ data: { slug: `qa-item-${id}`, sku: `QA-${id}`, name: "QA Item", priceMinor: 100000, description: "Temporary integration fixture", status: "ACTIVE" } });
  const warehouse = await db.warehouse.create({ data: { code: `QA-${id}`, name: "Ephemeral warehouse", city: "QA", state: "QA" } });
  const inventory = await db.inventoryItem.create({ data: { productId: product.id, warehouseId: warehouse.id, onHand, reserved: 0, reorderLevel: 0 } });
  const payload: CreateOrderPayload = validateOrder({
    items: [{ productId: product.id, quantity: 1 }],
    shippingAddress: { fullName: "QA Test", phone: "9876543210", line1: "QA Street", city: "Indore", state: "MP", postalCode: "452001" },
    contactEmail: user.email, paymentMethod: "cod", deliveryMethod: "standard",
  });
  return { user, product, warehouse, inventory, payload };
}
async function stock(id: string) {
  return db.inventoryItem.findUniqueOrThrow({ where: { id } });
}
before(async () => {
  await db.$connect();
  console.log("QA_DB_IDENTITY", JSON.stringify({ host: new URL(process.env.DATABASE_URL!).hostname, database: "nexora_qa", schemaMode: "Prisma db push; no repository migrations found" }));
});
after(async () => { await db.$disconnect(); });

test("DB baseline: one valid order creates one reservation and movement", async () => {
  const f = await fixture(2);
  const order = await createOrder(f.user.id, f.payload);
  const inventory = await stock(f.inventory.id);
  const movements = await db.inventoryMovement.findMany({ where: { reference: order.orderNumber } });
  console.log("QA_DB_BASELINE", JSON.stringify({ orderId: order.id, reserved: inventory.reserved, movements: movements.length }));
  assert.equal(inventory.reserved, 1);
  assert.equal(movements.filter(m => m.type === "RESERVE").length, 1);
  assert.equal(order.totalMinor, 118000);
});

test("DB baseline: insufficient stock rejects order before opening transaction", async () => {
  const f = await fixture(0);
  await assert.rejects(createOrder(f.user.id, f.payload), /enough stock/);
  assert.equal(await db.order.count({ where: { userId: f.user.id } }), 0);
  assert.equal((await stock(f.inventory.id)).reserved, 0);
});

test("DB rollback: injected reservation failure rolls back order and reserved stock", async () => {
  const f = await fixture(1);
  await db.$executeRawUnsafe(`CREATE OR REPLACE FUNCTION qa_abort_reserve() RETURNS trigger AS $$
    BEGIN IF NEW."type" = 'RESERVE' THEN RAISE EXCEPTION 'qa injected reservation rollback'; END IF; RETURN NEW; END;
    $$ LANGUAGE plpgsql`);
  await db.$executeRawUnsafe(`CREATE TRIGGER qa_abort_reserve_trigger BEFORE INSERT ON "InventoryMovement" FOR EACH ROW EXECUTE FUNCTION qa_abort_reserve()`);
  try {
    await assert.rejects(createOrder(f.user.id, f.payload));
    assert.equal(await db.order.count({ where: { userId: f.user.id } }), 0);
    assert.equal((await stock(f.inventory.id)).reserved, 0);
    console.log("QA_DB_ROLLBACK", JSON.stringify({ orders: 0, reserved: 0 }));
  } finally {
    await db.$executeRawUnsafe('DROP TRIGGER IF EXISTS qa_abort_reserve_trigger ON "InventoryMovement"');
    await db.$executeRawUnsafe("DROP FUNCTION IF EXISTS qa_abort_reserve()");
  }
});

test("RISK-01: same keyed checkout replay returns one persisted order", async () => {
  const f = await fixture(5);
  const key = "qa-replay-key-" + suffix();
  const first = await createOrder(f.user.id, f.payload, key);
  const second = await createOrder(f.user.id, f.payload, key);
  const count = await db.order.count({ where: { userId: f.user.id } });
  const reserved = (await stock(f.inventory.id)).reserved;
  console.log("QA_RISK_01_OBSERVED", JSON.stringify({ first: first.orderNumber, second: second.orderNumber, orderCount: count, reserved }));
  assert.equal(count, 1, "REPLAY DEFECT: identical retry created multiple orders (no idempotency key)");
});

test("RISK-02 invariant: simultaneous requests for the last item must not oversell", async () => {
  const f = await fixture(1);
  // Delay inventory updates within PostgreSQL, allowing both independent pre-transaction reads.
  await db.$executeRawUnsafe(`CREATE OR REPLACE FUNCTION qa_pause_reserve() RETURNS trigger AS $$
    BEGIN IF NEW.reserved > OLD.reserved THEN PERFORM pg_sleep(0.3); END IF; RETURN NEW; END;
    $$ LANGUAGE plpgsql`);
  await db.$executeRawUnsafe(`CREATE TRIGGER qa_pause_reserve_trigger BEFORE UPDATE ON "InventoryItem" FOR EACH ROW EXECUTE FUNCTION qa_pause_reserve()`);
  let outcomes: PromiseSettledResult<unknown>[];
  try {
    outcomes = await Promise.allSettled([createOrder(f.user.id, f.payload), createOrder(f.user.id, f.payload)]);
  } finally {
    await db.$executeRawUnsafe('DROP TRIGGER IF EXISTS qa_pause_reserve_trigger ON "InventoryItem"');
    await db.$executeRawUnsafe("DROP FUNCTION IF EXISTS qa_pause_reserve()");
  }
  const successful = outcomes.filter(x => x.status === "fulfilled").length;
  const current = await stock(f.inventory.id);
  console.log("QA_RISK_02_OBSERVED", JSON.stringify({ onHand: current.onHand, reserved: current.reserved, successfulOrders: successful, rejectedRequests: outcomes.length - successful }));
  assert.ok(current.reserved <= current.onHand && successful <= 1, "OVERSELL DEFECT: reservations exceed physical stock");
});

test("RISK-03 invariant: duplicate cart lines may not reserve more than available", async () => {
  const f = await fixture(1);
  const payload = { ...f.payload, items: [{ productId: f.product.id, quantity: 1 }, { productId: f.product.id, quantity: 1 }] };
  let rejection: unknown;
  try { await createOrder(f.user.id, payload); } catch (error) { rejection = error; }
  const current = await stock(f.inventory.id);
  console.log("QA_RISK_03_OBSERVED", JSON.stringify({ rejected: Boolean(rejection), onHand: current.onHand, reserved: current.reserved }));
  assert.ok(rejection || current.reserved <= current.onHand, "DUPLICATE LINE DEFECT: cumulative cart quantity exceeded inventory");
});

test("RISK-03 invariant: reject invalid phone and PIN before creating an order", () => {
  const valid = {
    items: [{ productId: "p", quantity: 1 }],
    shippingAddress: { fullName: "QA", phone: "not-a-phone", line1: "Test", city: "City", state: "MP", postalCode: "invalid" },
    contactEmail: "qa@example.invalid",
  };
  let rejected = false;
  try { validateOrder(valid); } catch { rejected = true; }
  console.log("QA_RISK_03_INVALID_CONTACT", JSON.stringify({ rejected }));
  assert.equal(rejected, true, "INVALID INPUT DEFECT: phone/PIN format accepted");
});

test("RISK-03 invariant: reject excessive customer field lengths before creating order", () => {
  const payload = {
    items: [{ productId: "p", quantity: 1 }],
    shippingAddress: { fullName: "A".repeat(10000), phone: "9876543210", line1: "B".repeat(10000), city: "C", state: "D", postalCode: "452001" },
    contactEmail: "qa@example.invalid",
  };
  let rejected = false;
  try { validateOrder(payload); } catch { rejected = true; }
  console.log("QA_RISK_03_OVERSIZED", JSON.stringify({ rejected, nameLength: payload.shippingAddress.fullName.length }));
  assert.equal(rejected, true, "INVALID INPUT DEFECT: unbounded checkout fields accepted");
});

test("RISK-04: coupon usage limit is enforced atomically in disposable QA tables", async () => {
  // Prisma schema does not define Coupon/CouponRedemption: create minimal ephemeral test-only contract tables.
  await db.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "Coupon" (
    "id" text PRIMARY KEY, "code" text UNIQUE NOT NULL, "kind" text NOT NULL,
    "value" integer NOT NULL, "minSubtotalMinor" integer NOT NULL DEFAULT 0,
    "maxDiscountMinor" integer, "active" boolean NOT NULL DEFAULT true,
    "startsAt" timestamp, "endsAt" timestamp, "usageLimit" integer,
    "usageCount" integer NOT NULL DEFAULT 0, "updatedAt" timestamp NOT NULL DEFAULT now())`);
  await db.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "CouponRedemption" (
    "id" text PRIMARY KEY, "couponId" text NOT NULL, "userId" text NOT NULL,
    "orderId" text UNIQUE NOT NULL, "discountMinor" integer NOT NULL,
    "createdAt" timestamp NOT NULL DEFAULT now())`);
  const id = suffix();
  const code = `QA${id.toUpperCase()}`;
  await db.$executeRaw`INSERT INTO "Coupon" ("id","code","kind","value","minSubtotalMinor","usageLimit") VALUES (${id},${code},'PERCENT',10,0,1)`;
  const [a, b] = await Promise.all([resolveCoupon(code, 10000), resolveCoupon(code, 10000)]);
  assert.equal(Boolean(a.coupon), true);
  assert.equal(Boolean(b.coupon), true);
  const f = await fixture(10);
  const results = await Promise.allSettled([
    db.$transaction(tx => recordCouponRedemption(tx, { coupon: a.coupon, discountMinor: a.discountMinor, orderId: "QA-O1-" + id, userId: f.user.id })),
    db.$transaction(tx => recordCouponRedemption(tx, { coupon: b.coupon, discountMinor: b.discountMinor, orderId: "QA-O2-" + id, userId: f.user.id })),
  ]);
  assert.equal(results.filter(r => r.status === "fulfilled").length, 1, "Only one coupon use can commit.");
  const rows = await db.$queryRaw<Array<{ usageCount: number }>>`SELECT "usageCount" FROM "Coupon" WHERE "id"=${id}`;
  const redemptionCount = await db.$queryRaw<Array<{ count: bigint }>>`SELECT count(*) as count FROM "CouponRedemption" WHERE "couponId"=${id}`;
  console.log("QA_RISK_04_OBSERVED", JSON.stringify({ usageLimit: 1, usageCount: rows[0].usageCount, redemptionCount: Number(redemptionCount[0].count), schema: "temporary QA-only coupon tables" }));
  assert.equal(rows[0].usageCount, 1);
  assert.equal(Number(redemptionCount[0].count), 1);
});

test("idempotency conflict: same key and changed cart is rejected without another reservation", async () => {
  const f = await fixture(8);
  const key = "qa-conflict-" + suffix();
  await createOrder(f.user.id, f.payload, key);
  const different = { ...f.payload, items: [{ productId: f.product.id, quantity: 2 }] };
  await assert.rejects(createOrder(f.user.id, different, key), /different order request/);
  assert.equal(await db.order.count({ where: { userId: f.user.id } }), 1);
  assert.equal((await stock(f.inventory.id)).reserved, 1);
});

test("idempotency concurrency: two identical keyed checkouts for last unit resolve one order", async () => {
  const f = await fixture(1);
  const key = "qa-race-" + suffix();
  const results = await Promise.allSettled([
    createOrder(f.user.id, f.payload, key),
    createOrder(f.user.id, f.payload, key),
  ]);
  assert.equal(results.filter(r => r.status === "fulfilled").length, 2,
    "Both retries should return the same persisted order");
  const orders = results.map(r => r.status === "fulfilled" ? r.value : null);
  assert.equal(orders[0]?.id, orders[1]?.id);
  assert.equal(await db.order.count({ where: { userId: f.user.id } }), 1);
  assert.equal((await stock(f.inventory.id)).reserved, 1);
});

test("intentional separate purchases with different keys remain allowed", async () => {
  const f = await fixture(2);
  const a = await createOrder(f.user.id, f.payload, "qa-purchase-" + suffix());
  const b = await createOrder(f.user.id, f.payload, "qa-purchase-" + suffix());
  assert.notEqual(a.id, b.id);
  assert.equal((await stock(f.inventory.id)).reserved, 2);
});

test("lost checkout response recovery is read-only, email-scoped and prevents duplicate reservations", async () => {
  const f = await fixture(2);
  const key = "qa-recover-" + suffix();
  const created = await createOrderWithOutcome(f.user.id, f.payload, key);
  assert.equal(created.created, true);
  const beforeReserved = (await stock(f.inventory.id)).reserved;
  const beforeMovements = await db.inventoryMovement.count({
    where: { productId: f.product.id, type: "RESERVE" },
  });
  const recovered = await recoverCompletedCheckoutAttempt({ key, email: f.user.email.toUpperCase() });
  assert.equal(recovered.orderNumber, created.order.orderNumber);
  assert.deepEqual(Object.keys(recovered).sort(),
    ["orderNumber", "paymentMethod", "paymentStatus", "status"].sort());
  await assert.rejects(
    recoverCompletedCheckoutAttempt({ key: "qa-wrong-" + suffix(), email: f.user.email }),
    /No completed order matches/,
  );
  await assert.rejects(
    recoverCompletedCheckoutAttempt({ key, email: "wrong-" + suffix() + "@example.invalid" }),
    /No completed order matches/,
  );
  const http = await recoverRoute(new Request("http://127.0.0.1:3137/api/backend/orders/recover", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key, email: f.user.email }),
  }));
  assert.equal(http.status, 200);
  assert.equal(http.headers.get("Cache-Control"), "private, no-store");
  const body = await http.json() as { ok: boolean; data: Record<string, unknown> };
  assert.equal(body.ok, true);
  assert.equal(body.data.orderNumber, created.order.orderNumber);
  assert.equal(JSON.stringify(body).includes(f.payload.shippingAddress.line1), false);
  assert.equal(JSON.stringify(body).includes(f.user.email), false);
  const replay = await createOrderWithOutcome(f.user.id, f.payload, key);
  assert.equal(replay.created, false);
  assert.equal(replay.order.id, created.order.id);
  assert.equal(await db.order.count({ where: { userId: f.user.id } }), 1);
  assert.equal((await stock(f.inventory.id)).reserved, beforeReserved);
  assert.equal(await db.inventoryMovement.count({
    where: { productId: f.product.id, type: "RESERVE" },
  }), beforeMovements);
});

test("unknown checkout key recovery does not create a customer, order or stock reservation", async () => {
  const email = "missing-recovery-" + suffix() + "@example.invalid";
  const before = await db.user.count({ where: { email } });
  await assert.rejects(
    recoverCompletedCheckoutAttempt({ email, key: "qa-no-order-" + suffix() }),
    /No completed order matches/,
  );
  assert.equal(await db.user.count({ where: { email } }), before);
  const http = await recoverRoute(new Request("http://127.0.0.1:3137/api/backend/orders/recover", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, key: "qa-no-order-" + suffix() }),
  }));
  assert.equal(http.status, 404);
  assert.equal(http.headers.get("Cache-Control"), "private, no-store");
  assert.equal(await db.user.count({ where: { email } }), before);
});
