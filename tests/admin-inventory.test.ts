import assert from "node:assert/strict";
import test from "node:test";
import { reconcileOrder } from "../lib/admin/stock";

type Transaction = Parameters<typeof reconcileOrder>[0];
type Reserve = { id: string; warehouseId: string; productId: string; quantity: number };
type Inventory = { id: string; reserved: number; onHand: number };

function fakeTransaction(options: {
  settled?: boolean;
  reserves?: Reserve[];
  inventory?: Record<string, Inventory>;
} = {}) {
  const reserves = options.reserves ?? [{ id: "reserve-1", warehouseId: "W1", productId: "P1", quantity: 3 }];
  const inventory = options.inventory ?? { W1: { id: "stock-1", reserved: 5, onHand: 8 } };
  const updates: unknown[] = [];
  const movementWrites: unknown[] = [];
  let reserveQueries = 0;

  const tx = {
    inventoryMovement: {
      findFirst: async () => options.settled ? { id: "previous-settlement" } : null,
      findMany: async () => { reserveQueries++; return reserves; },
      create: async ({ data }: { data: unknown }) => { movementWrites.push(data); return data; },
    },
    inventoryItem: {
      findUnique: async ({ where }: { where: { productId_warehouseId: { warehouseId: string } } }) =>
        inventory[where.productId_warehouseId.warehouseId] ?? null,
      update: async ({ data }: { data: unknown }) => { updates.push(data); return data; },
    },
  };

  return { tx: tx as unknown as Transaction, updates, movementWrites, get reserveQueries() { return reserveQueries; } };
}

const order = { orderNumber: "NX-ORDER-1", items: [{ productId: "P1", quantity: 3 }] };

test("DELIVER reduces reserved and on-hand inventory and writes OUTBOUND movement", async () => {
  const mock = fakeTransaction();
  await reconcileOrder(mock.tx, order, "DELIVER");
  assert.deepEqual(mock.updates, [{ reserved: { decrement: 3 }, onHand: { decrement: 3 } }]);
  assert.equal(mock.movementWrites.length, 1);
  assert.deepEqual(mock.movementWrites[0], {
    warehouseId: "W1", productId: "P1", type: "OUTBOUND", quantity: 3,
    reference: "NX-ORDER-1", note: "ORDER_SETTLED:DELIVER:reserve-1",
  });
});

test("CANCEL releases reserved units but does not decrement on-hand", async () => {
  const mock = fakeTransaction();
  await reconcileOrder(mock.tx, order, "CANCEL");
  assert.deepEqual(mock.updates, [{ reserved: { decrement: 3 } }]);
  assert.equal((mock.movementWrites[0] as { type: string }).type, "RELEASE");
});

test("existing settlement is idempotent and performs no additional work", async () => {
  const mock = fakeTransaction({ settled: true });
  await reconcileOrder(mock.tx, order, "DELIVER");
  assert.equal(mock.reserveQueries, 0);
  assert.deepEqual(mock.updates, []);
  assert.deepEqual(mock.movementWrites, []);
});

test("insufficient reserved inventory rejects settlement", async () => {
  const mock = fakeTransaction({ inventory: { W1: { id: "stock-1", reserved: 1, onHand: 10 } } });
  await assert.rejects(reconcileOrder(mock.tx, order, "CANCEL"), /Inventory reservation mismatch/);
  assert.deepEqual(mock.updates, []);
});

test("DELIVER also validates physical inventory independently of reservations", async () => {
  const mock = fakeTransaction({ inventory: { W1: { id: "stock-1", reserved: 4, onHand: 2 } } });
  await assert.rejects(reconcileOrder(mock.tx, order, "DELIVER"), /Inventory reservation mismatch/);
  assert.deepEqual(mock.movementWrites, []);
});

test("uncovered reservation quantities fail rather than silently settling", async () => {
  const mock = fakeTransaction({ reserves: [] });
  await assert.rejects(reconcileOrder(mock.tx, order, "CANCEL"), /Reserved stock could not be fully reconciled/);
});

test("reservations can be reconciled across multiple warehouses", async () => {
  const mock = fakeTransaction({
    reserves: [
      { id: "r-1", warehouseId: "W1", productId: "P1", quantity: 2 },
      { id: "r-2", warehouseId: "W2", productId: "P1", quantity: 3 },
    ],
    inventory: {
      W1: { id: "s1", reserved: 2, onHand: 3 },
      W2: { id: "s2", reserved: 3, onHand: 5 },
    },
  });
  await reconcileOrder(mock.tx, order, "DELIVER");
  assert.deepEqual(mock.updates, [
    { reserved: { decrement: 2 }, onHand: { decrement: 2 } },
    { reserved: { decrement: 1 }, onHand: { decrement: 1 } },
  ]);
  assert.equal(mock.movementWrites.length, 2);
});
