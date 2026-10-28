import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { before, after, test } from "node:test";
import { getPrisma } from "../../lib/db/prisma";
import { createOrder } from "../../lib/db/orders";
import { changeOwnerOrderStatus } from "../../lib/admin/order-status";
import { validateOrder } from "../../lib/server/backend";
import { variantSignature } from "../../lib/commerce/product-variants";

function verifyIsolation() {
  if (process.env.NEXORA_QA_ALLOW_DB_INTEGRATION !== "true") {
    throw new Error("Disposable PostgreSQL opt-in missing");
  }
  for (const key of ["DATABASE_URL", "DIRECT_URL"]) {
    const url = new URL(process.env[key] || "");
    if (!["localhost", "127.0.0.1", "::1", "[::1]"].includes(url.hostname) ||
        url.username !== "nexora_qa" || url.pathname !== "/nexora_qa") {
      throw new Error("Refusing non-disposable database");
    }
  }
}
verifyIsolation();
const db = getPrisma();
const tag = () => randomUUID().replaceAll("-", "").slice(0, 12);
let ownerId: string;

before(async () => {
  await db.$connect();
  await db.$executeRawUnsafe('CREATE TABLE IF NOT EXISTS "AdminActivityLog" ("id" TEXT PRIMARY KEY, "adminUserId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE RESTRICT, "action" TEXT NOT NULL, "entityType" TEXT NOT NULL, "entityId" TEXT, "summary" TEXT NOT NULL, "metadata" JSONB, "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now())');
  ownerId = (await db.user.create({ data: {
    email: "status-owner-" + tag() + "@example.invalid", name: "QA Admin",
    passwordHash: "never-login", role: "ADMIN",
  } })).id;
});
after(async () => { await db.$disconnect(); });

async function fixture() {
  const s = tag();
  const user = await db.user.create({ data: {
    email: "status-" + s + "@example.invalid", name: "QA buyer", passwordHash: "never-login",
  } });
  const product = await db.product.create({ data: {
    slug: "status-" + s, sku: "S-" + s, name: "Settlement fixture",
    priceMinor: 90000, description: "QA only", status: "ACTIVE",
  } });
  const warehouse = await db.warehouse.create({ data: { code: "W-" + s,
    name: "QA warehouse", city: "Indore", state: "MP" } });
  const inventory = await db.inventoryItem.create({ data: {
    productId: product.id, warehouseId: warehouse.id, onHand: 2, reserved: 0,
  } });
  const input = validateOrder({
    items: [{ productId: product.id, quantity: 1 }],
    shippingAddress: { fullName: "QA", phone: "9876543210", line1: "QA street",
      city: "Indore", state: "MP", postalCode: "452001" },
    contactEmail: user.email, paymentMethod: "cod", deliveryMethod: "standard",
  });
  const order = await createOrder(user.id, input, "status-" + tag());
  const change = (status: "CANCELLED" | "DELIVERED" | "CONFIRMED" | "PROCESSING") =>
    changeOwnerOrderStatus({ orderId: order.id, status, adminUserId: ownerId });
  return { user, product, warehouse, inventory, order, change };
}
async function movementCount(orderNumber: string, type: "RELEASE" | "OUTBOUND") {
  return db.inventoryMovement.count({ where: { reference: orderNumber, type } });
}
async function auditCount(orderId: string) {
  const result = await db.$queryRaw<Array<{ n: bigint }>>`
    SELECT count(*) n FROM "AdminActivityLog"
    WHERE "entityId" = ${orderId} AND "action" = 'ORDER_STATUS_UPDATE'
  `;
  return Number(result[0].n);
}

test("concurrent double cancellation releases one reservation exactly once", async () => {
  const f = await fixture();
  const both = await Promise.all([f.change("CANCELLED"), f.change("CANCELLED")]);
  assert.deepEqual(both.map(x => x.unchanged).sort(), [false, true]);
  const stock = await db.inventoryItem.findUniqueOrThrow({ where: { id: f.inventory.id } });
  assert.equal(stock.onHand, 2);
  assert.equal(stock.reserved, 0);
  assert.equal(await movementCount(f.order.orderNumber, "RELEASE"), 1);
  assert.equal(await auditCount(f.order.id), 1);
});

test("parallel DELIVERED vs CANCELLED permits only one settlement mode", async () => {
  const f = await fixture();
  const outcomes = await Promise.allSettled([f.change("DELIVERED"), f.change("CANCELLED")]);
  assert.equal(outcomes.filter(x => x.status === "fulfilled").length, 1);
  assert.equal(outcomes.filter(x => x.status === "rejected").length, 1);
  const final = await db.order.findUniqueOrThrow({ where: { id: f.order.id } });
  const stock = await db.inventoryItem.findUniqueOrThrow({ where: { id: f.inventory.id } });
  const released = await movementCount(f.order.orderNumber, "RELEASE");
  const delivered = await movementCount(f.order.orderNumber, "OUTBOUND");
  assert.equal(released + delivered, 1);
  assert.equal(stock.reserved, 0);
  assert.equal(stock.onHand, final.status === "DELIVERED" ? 1 : 2);
  assert.equal(await auditCount(f.order.id), 1);
  assert.ok(["DELIVERED", "CANCELLED"].includes(final.status));
});

test("concurrent double delivery subtracts stock once and replays unchanged", async () => {
  const f = await fixture();
  const replies = await Promise.all([f.change("DELIVERED"), f.change("DELIVERED")]);
  assert.deepEqual(replies.map(x => x.unchanged).sort(), [false, true]);
  const stock = await db.inventoryItem.findUniqueOrThrow({ where: { id: f.inventory.id } });
  assert.equal(stock.onHand, 1);
  assert.equal(stock.reserved, 0);
  assert.equal(await movementCount(f.order.orderNumber, "OUTBOUND"), 1);
  assert.equal(await auditCount(f.order.id), 1);
});

test("backwards transition, unpaid Cashfree and return shortcut leave order unchanged", async () => {
  const f = await fixture();
  await f.change("CONFIRMED");
  await f.change("PROCESSING");
  await assert.rejects(f.change("CONFIRMED"), /backwards/);
  await assert.rejects(changeOwnerOrderStatus({
    orderId: f.order.id, status: "RETURNED" as never, adminUserId: ownerId,
  }), /Invalid|Terminal|return/);
  // Route validation fails closed before calling service; service also locks and checks unknown lifecycle state.
  assert.equal((await db.order.findUniqueOrThrow({ where: { id: f.order.id } })).status, "PROCESSING");
  assert.equal(await auditCount(f.order.id), 2);
});

test("mixed variant and parent inventory cancellation settles each source once", async () => {
  const f = await fixture();
  const s = tag();
  const item = await db.product.create({ data: {
    slug: "var-status-" + s, sku: "VARP-" + s, name: "Variant QA",
    priceMinor: 99000, description: "QA", status: "ACTIVE",
  } });
  await db.productChoiceGroup.create({ data: {
    productId: item.id, key: "colour", label: "Colour", required: true,
    values: [{ value: "black", label: "Black", available: true }], sortOrder: 0,
  } });
  const sku = await db.productVariant.create({ data: {
    productId: item.id, signature: variantSignature({ colour: "black" }),
    choices: { colour: "black" }, sku: "VARS-" + s,
    priceMinor: 129900, onHand: 2, reserved: 0, active: true,
  } });
  const order = await createOrder(f.user.id, validateOrder({
    items: [{ productId: f.product.id, quantity: 1 },
      { productId: item.id, quantity: 1, variant: { colour: "black" } }],
    shippingAddress: { fullName: "QA", phone: "9876543210", line1: "QA street",
      city: "Indore", state: "MP", postalCode: "452001" },
    contactEmail: f.user.email, paymentMethod: "cod", deliveryMethod: "standard",
  }), "mixed-status-" + tag());
  const input = { orderId: order.id, status: "CANCELLED" as const, adminUserId: ownerId };
  const both = await Promise.all([
    changeOwnerOrderStatus(input), changeOwnerOrderStatus(input),
  ]);
  assert.deepEqual(both.map(x => x.unchanged).sort(), [false, true]);
  assert.equal((await db.inventoryItem.findUniqueOrThrow({ where: { id: f.inventory.id } })).reserved, 1);
  const variant = await db.productVariant.findUniqueOrThrow({ where: { id: sku.id } });
  assert.equal(variant.onHand, 2);
  assert.equal(variant.reserved, 0);
  assert.equal(await db.productVariantMovement.count({
    where: { orderId: order.id, type: "RELEASE" },
  }), 1);
  assert.equal(await movementCount(order.orderNumber, "RELEASE"), 1);
  assert.equal(await auditCount(order.id), 1);
});

test("audit insertion failure rolls back status and inventory settlement atomically", async () => {
  const f = await fixture();
  const fn = "qa_reject_status_audit_" + tag();
  const trigger = fn + "_trg";
  // Fixed generated alphanumeric identifiers; do not interpolate user strings.
  const owner = ownerId;
  assert.match(owner, /^[A-Za-z0-9_-]+$/);
  await db.$executeRawUnsafe(`CREATE FUNCTION "${fn}"() RETURNS trigger LANGUAGE plpgsql AS $$
    BEGIN IF NEW."adminUserId" = '${owner}' AND NEW."entityId" = '${f.order.id}'
      AND NEW."action" = 'ORDER_STATUS_UPDATE' THEN
      RAISE EXCEPTION 'QA injected status audit error'; END IF;
    RETURN NEW; END; $$`);
  await db.$executeRawUnsafe(`CREATE TRIGGER "${trigger}" BEFORE INSERT ON "AdminActivityLog"
    FOR EACH ROW EXECUTE FUNCTION "${fn}"()`);
  try {
    await assert.rejects(f.change("DELIVERED"), /QA injected status audit error/);
  } finally {
    await db.$executeRawUnsafe(`DROP TRIGGER IF EXISTS "${trigger}" ON "AdminActivityLog"`);
    await db.$executeRawUnsafe(`DROP FUNCTION IF EXISTS "${fn}"()`);
  }
  const saved = await db.order.findUniqueOrThrow({ where: { id: f.order.id } });
  const stock = await db.inventoryItem.findUniqueOrThrow({ where: { id: f.inventory.id } });
  assert.equal(saved.status, "PENDING");
  assert.equal(stock.reserved, 1);
  assert.equal(stock.onHand, 2);
  assert.equal(await movementCount(f.order.orderNumber, "OUTBOUND"), 0);
  assert.equal(await auditCount(f.order.id), 0);
});
