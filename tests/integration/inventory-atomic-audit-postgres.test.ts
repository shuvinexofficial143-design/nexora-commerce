import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { before, after, test } from "node:test";
import { getPrisma } from "../../lib/db/prisma";
import { adjustStock, StockAdjustmentConflict } from "../../lib/admin/inventory-admin";

function assertDisposableDatabase() {
  if (process.env.NEXORA_QA_ALLOW_DB_INTEGRATION !== "true") throw new Error("QA database opt-in missing");
  for (const key of ["DATABASE_URL", "DIRECT_URL"]) {
    const url = new URL(process.env[key] || "");
    if (!["127.0.0.1", "localhost", "::1", "[::1]"].includes(url.hostname) ||
        url.pathname !== "/nexora_qa" || url.username !== "nexora_qa") {
      throw new Error("Inventory audit tests refuse production or external databases.");
    }
  }
}
assertDisposableDatabase();
const db = getPrisma();
const tag = () => randomUUID().replaceAll("-", "").slice(0, 12);
let ownerId = "";

before(async () => {
  await db.$connect();
  await db.$executeRawUnsafe(
    'CREATE TABLE IF NOT EXISTS "AdminActivityLog" ("id" TEXT PRIMARY KEY, "adminUserId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE RESTRICT, "action" TEXT NOT NULL, "entityType" TEXT NOT NULL, "entityId" TEXT, "summary" TEXT NOT NULL, "metadata" JSONB, "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now())',
  );
  const admin = await db.user.create({ data: {
    email: "stock-audit-owner-" + tag() + "@example.invalid",
    name: "QA owner", passwordHash: "qa-never-login", role: "ADMIN",
  } });
  ownerId = admin.id;
});
after(async () => { await db.$disconnect(); });

async function fixture(onHand = 10, reserved = 0) {
  const s = tag();
  const product = await db.product.create({ data: {
    slug: "stock-audit-" + s, sku: "SA-" + s, name: "QA stock",
    description: "Disposable test fixture", priceMinor: 20000, status: "ACTIVE",
  } });
  const warehouse = await db.warehouse.create({ data: {
    code: "SA-W-" + s, name: "QA warehouse", city: "QA", state: "QA",
  } });
  const row = await db.inventoryItem.create({ data: {
    productId: product.id, warehouseId: warehouse.id, onHand, reserved, reorderLevel: 0,
  } });
  return { product, warehouse, row };
}
async function auditRows(id: string) {
  return db.$queryRawUnsafe<Array<{ action: string; summary: string; metadata: { note: string } }>>(
    'SELECT "action", "summary", "metadata" FROM "AdminActivityLog" WHERE "entityId"=$1 AND "action"=$2',
    id, "INVENTORY_ADJUSTMENT",
  );
}
async function adjustmentMovements(productId: string) {
  return db.inventoryMovement.findMany({ where: { productId, type: "ADJUSTMENT" } });
}
async function verifyStock(id: string) {
  return db.inventoryItem.findUniqueOrThrow({ where: { id } });
}

test("Owner adjustment atomically writes one correct movement and exactly one audit", async () => {
  const f = await fixture();
  const changed = await adjustStock({ inventoryId: f.row.id, delta: -2, note: "Damaged items" }, ownerId);
  assert.equal(changed.onHand, 8);
  assert.equal((await verifyStock(f.row.id)).reserved, 0);
  const movements = await adjustmentMovements(f.product.id);
  assert.equal(movements.length, 1);
  assert.equal(movements[0].quantity, -2);
  assert.equal(movements[0].note, "Damaged items");
  const audits = await auditRows(f.row.id);
  assert.equal(audits.length, 1);
  assert.equal(audits[0].summary, "Inventory adjusted by -2");
  assert.deepEqual(audits[0].metadata, { note: "Damaged items" });
});

test("failed Owner audit inserts roll back both the movement and stock update", async () => {
  const f = await fixture(10, 3);
  await db.$executeRawUnsafe(
    "CREATE FUNCTION qa_reject_stock_owner_audit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.\"action\" = 'INVENTORY_ADJUSTMENT' THEN RAISE EXCEPTION 'QA rejected inventory audit'; END IF; RETURN NEW; END; $$",
  );
  await db.$executeRawUnsafe(
    'CREATE TRIGGER qa_reject_stock_owner_audit_trg BEFORE INSERT ON "AdminActivityLog" FOR EACH ROW EXECUTE FUNCTION qa_reject_stock_owner_audit()',
  );
  try {
    await assert.rejects(adjustStock({
      inventoryId: f.row.id, delta: -5, note: "Damaged items",
    }, ownerId), /QA rejected inventory audit/);
  } finally {
    await db.$executeRawUnsafe('DROP TRIGGER IF EXISTS qa_reject_stock_owner_audit_trg ON "AdminActivityLog"');
    await db.$executeRawUnsafe("DROP FUNCTION IF EXISTS qa_reject_stock_owner_audit()");
  }
  assert.equal((await verifyStock(f.row.id)).onHand, 10);
  assert.equal((await verifyStock(f.row.id)).reserved, 3);
  assert.equal((await adjustmentMovements(f.product.id)).length, 0);
  assert.equal((await auditRows(f.row.id)).length, 0);
});

test("failed movement insert rolls back stock and never writes a false Owner audit", async () => {
  const f = await fixture();
  await db.$executeRawUnsafe(
    "CREATE FUNCTION qa_reject_stock_movement() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.\"type\"::text = 'ADJUSTMENT' THEN RAISE EXCEPTION 'QA rejected adjustment movement'; END IF; RETURN NEW; END; $$",
  );
  await db.$executeRawUnsafe(
    'CREATE TRIGGER qa_reject_stock_movement_trg BEFORE INSERT ON "InventoryMovement" FOR EACH ROW EXECUTE FUNCTION qa_reject_stock_movement()',
  );
  try {
    await assert.rejects(adjustStock({
      inventoryId: f.row.id, delta: 3, note: "New units",
    }, ownerId), /QA rejected adjustment movement/);
  } finally {
    await db.$executeRawUnsafe('DROP TRIGGER IF EXISTS qa_reject_stock_movement_trg ON "InventoryMovement"');
    await db.$executeRawUnsafe("DROP FUNCTION IF EXISTS qa_reject_stock_movement()");
  }
  assert.equal((await verifyStock(f.row.id)).onHand, 10);
  assert.equal((await adjustmentMovements(f.product.id)).length, 0);
  assert.equal((await auditRows(f.row.id)).length, 0);
});

test("two simultaneous Owner adjustments preserve both deltas, movements and audits", async () => {
  const f = await fixture(5);
  await Promise.all([
    adjustStock({ inventoryId: f.row.id, delta: 2, note: "Owner receipt A" }, ownerId),
    adjustStock({ inventoryId: f.row.id, delta: 3, note: "Owner receipt B" }, ownerId),
  ]);
  assert.equal((await verifyStock(f.row.id)).onHand, 10);
  assert.equal((await adjustmentMovements(f.product.id)).length, 2);
  assert.equal((await auditRows(f.row.id)).length, 2);
});

test("reserved units cannot be removed and failed adjustment leaves no audit", async () => {
  const f = await fixture(4, 3);
  await assert.rejects(adjustStock({
    inventoryId: f.row.id, delta: -2, note: "Invalid reduction",
  }, ownerId), StockAdjustmentConflict);
  assert.equal((await verifyStock(f.row.id)).onHand, 4);
  assert.equal((await adjustmentMovements(f.product.id)).length, 0);
  assert.equal((await auditRows(f.row.id)).length, 0);
  await adjustStock({ inventoryId: f.row.id, delta: -1, note: "Valid reduction" }, ownerId);
  assert.equal((await verifyStock(f.row.id)).onHand, 3);
  assert.equal((await auditRows(f.row.id)).length, 1);
});

test("forged or nonexistent Owner identity cannot leave unaudited inventory writes", async () => {
  const f = await fixture();
  await assert.rejects(adjustStock({
    inventoryId: f.row.id, delta: 1, note: "Spoofed owner",
  }, "nonexistent-owner-" + tag()));
  assert.equal((await verifyStock(f.row.id)).onHand, 10);
  assert.equal((await adjustmentMovements(f.product.id)).length, 0);
  assert.equal((await auditRows(f.row.id)).length, 0);
});
