import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, test } from "node:test";
import { getPrisma } from "../../lib/db/prisma";
import { createCheckoutPreview, validateCheckoutPreview } from "../../lib/commerce/checkout-preview";
import { createOrder } from "../../lib/db/orders";
import { validateOrder } from "../../lib/server/backend";

function verifyIsolation() {
  if (process.env.NEXORA_QA_ALLOW_DB_INTEGRATION !== "true") throw new Error("Opt-in for disposable test database required");
  for (const key of ["DATABASE_URL", "DIRECT_URL"]) {
    const url = new URL(process.env[key] || "");
    if (!["127.0.0.1", "localhost", "::1", "[::1]"].includes(url.hostname)
      || url.username !== "nexora_qa" || url.pathname !== "/nexora_qa") {
      throw new Error("Refusing non-disposable or production database");
    }
  }
}
verifyIsolation();
const db = getPrisma();
const uid = () => randomUUID().replaceAll("-", "").slice(0, 12);
async function fixture(onHand = 5) {
  const id = uid();
  const user = await db.user.create({ data: { email: `preview-${id}@example.invalid`, name: "Preview Test", passwordHash: "qa-no-login" } });
  const product = await db.product.create({ data: {
    slug: "qa-preview-" + id, sku: "P-QA-" + id, name: "Test Checkout Product",
    description: "Temporary preview fixture", status: "ACTIVE", priceMinor: 80000,
  } });
  const warehouse = await db.warehouse.create({ data: { code: "P-QA-" + id, name: "QA", city: "Indore", state: "MP" } });
  const inventory = await db.inventoryItem.create({
    data: { productId: product.id, warehouseId: warehouse.id, onHand, reserved: 0 },
  });
  return { user, product, inventory };
}
before(async () => { await db.$connect(); });
after(async () => { await db.$disconnect(); });

test("preview reads current PostgreSQL price and stock without order or inventory reservation", async () => {
  const f = await fixture(5);
  const preview = await createCheckoutPreview(validateCheckoutPreview({
    items: [{ slug: f.product.slug, quantity: 2, clientPriceMinor: 80000 }],
    deliveryMethod: "standard",
  }));
  assert.equal(preview.valid, true);
  assert.equal(preview.changedPrice, false);
  assert.equal(preview.lines[0].unitPriceMinor, 80000);
  assert.equal(preview.lines[0].availableStock, 5);
  assert.equal(preview.subtotalMinor, 160000);
  assert.equal(preview.shippingMinor, 0);
  assert.equal(preview.taxMinor, 28800);
  assert.equal(preview.totalMinor, 188800);
  assert.equal(await db.order.count({ where: { userId: f.user.id } }), 0);
  assert.equal((await db.inventoryItem.findUniqueOrThrow({ where: { id: f.inventory.id } })).reserved, 0);
});

test("outdated cart price is flagged, not silently charged at a new price", async () => {
  const f = await fixture(6);
  await db.product.update({ where: { id: f.product.id }, data: { priceMinor: 91000 } });
  const checked = await createCheckoutPreview(validateCheckoutPreview({
    items: [{ slug: f.product.slug, quantity: 1, clientPriceMinor: 80000 }],
  }));
  assert.equal(checked.valid, true);
  assert.equal(checked.changedPrice, true);
  assert.equal(checked.lines[0].unitPriceMinor, 91000);
  assert.equal(checked.subtotalMinor, 91000);
  assert.equal(checked.shippingMinor, 9900);
  assert.equal(checked.totalMinor, 117280);
  const accepted = await createCheckoutPreview(validateCheckoutPreview({
    items: [{ slug: f.product.slug, quantity: 1, clientPriceMinor: 91000 }],
  }));
  assert.equal(accepted.changedPrice, false);
});

test("duplicate variant lines aggregate stock and reject oversell without touching reservations", async () => {
  const f = await fixture(3);
  const checked = await createCheckoutPreview(validateCheckoutPreview({
    items: [
      { slug: f.product.slug, quantity: 2, clientPriceMinor: 80000 },
      { slug: f.product.slug, quantity: 2, clientPriceMinor: 80000 },
    ],
  }));
  assert.equal(checked.valid, false);
  assert.equal(checked.lines.every(item => item.state === "insufficient_stock"), true);
  assert.equal(checked.issues.filter(issue => issue.includes("insufficient stock")).length, 1);
  assert.equal((await db.inventoryItem.findUniqueOrThrow({ where: { id: f.inventory.id } })).reserved, 0);
});

test("unpublished and archived products do not resolve to purchasable cart lines", async () => {
  const f = await fixture(4);
  for (const status of ["DRAFT", "ARCHIVED"] as const) {
    await db.product.update({ where: { id: f.product.id }, data: { status } });
    const checked = await createCheckoutPreview(validateCheckoutPreview({
      items: [{ slug: f.product.slug, quantity: 1 }],
    }));
    assert.equal(checked.valid, false);
    assert.equal(checked.lines[0].productId, null);
    assert.equal(checked.lines[0].state, "unavailable");
  }
});

test("successful order uses the same server totals and reserves stock only in order transaction", async () => {
  const f = await fixture(2);
  const quote = await createCheckoutPreview(validateCheckoutPreview({
    items: [{ slug: f.product.slug, quantity: 1, clientPriceMinor: 80000 }],
  }));
  assert.equal(quote.totalMinor, 104300);
  const payload = validateOrder({
    items: [{ productId: f.product.id, quantity: 1 }],
    shippingAddress: { fullName: "QA Customer", phone: "9876543210", line1: "QA Address",
      city: "Indore", state: "MP", postalCode: "452001" },
    contactEmail: f.user.email,
    paymentMethod: "cod", deliveryMethod: "standard",
  });
  const order = await createOrder(f.user.id, payload, "preview-qa-" + uid());
  assert.equal(order.totalMinor, quote.totalMinor);
  assert.equal(order.shippingMinor, quote.shippingMinor);
  assert.equal(order.taxMinor, quote.taxMinor);
  assert.equal((await db.inventoryItem.findUniqueOrThrow({ where: { id: f.inventory.id } })).reserved, 1);
  assert.equal(await db.order.count({ where: { userId: f.user.id } }), 1);
});

test("stock can change after preview and subsequent preflight blocks oversell", async () => {
  const f = await fixture(1);
  const input = validateCheckoutPreview({ items: [{ slug: f.product.slug, quantity: 1 }] });
  assert.equal((await createCheckoutPreview(input)).valid, true);
  await db.inventoryItem.update({ where: { id: f.inventory.id }, data: { reserved: 1 } });
  const changed = await createCheckoutPreview(input);
  assert.equal(changed.valid, false);
  assert.equal(changed.lines[0].availableStock, 0);
});
