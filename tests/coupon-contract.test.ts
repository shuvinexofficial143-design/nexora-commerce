import assert from "node:assert/strict";
import test from "node:test";
import { recordCouponRedemption } from "../lib/commerce/coupon-engine";
import type { CouponRecord } from "../lib/commerce/coupon-engine";

type Tx = Parameters<typeof recordCouponRedemption>[0];

function coupon(): CouponRecord {
  return { id: "coupon-1", code: "TEST10", kind: "PERCENT", value: 10, minSubtotalMinor: 0, maxDiscountMinor: null, active: true, startsAt: null, endsAt: null, usageLimit: null, usageCount: 0 };
}

function fakeTransaction(hasRedemption = false) {
  const queries: Array<{ sql: string; values: unknown[] }> = [];
  const operations: Array<{ sql: string; values: unknown[] }> = [];
  const tx = {
    $queryRaw: async (strings: TemplateStringsArray, ...values: unknown[]) => {
      queries.push({ sql: strings.join("?"), values });
      return hasRedemption ? [{ id: "redemption-1" }] : [];
    },
    $executeRaw: async (strings: TemplateStringsArray, ...values: unknown[]) => {
      operations.push({ sql: strings.join("?"), values });
      return 1;
    },
  } as unknown as Tx;
  return { tx, queries, operations };
}

test("redemption with no coupon is a no-op and never executes SQL", async () => {
  const mock = fakeTransaction();
  await recordCouponRedemption(mock.tx, { coupon: null, discountMinor: 500, orderId: "order-1", userId: "user-1" });
  assert.equal(mock.queries.length, 0);
  assert.equal(mock.operations.length, 0);
});

test("zero and negative coupon discounts do not count as redemptions", async () => {
  const mock = fakeTransaction();
  for (const value of [0, -1]) {
    await recordCouponRedemption(mock.tx, { coupon: coupon(), discountMinor: value, orderId: "order-1", userId: "user-1" });
  }
  assert.equal(mock.operations.length, 0);
});

test("existing redemption for the same order does not apply a second coupon", async () => {
  const mock = fakeTransaction(true);
  await recordCouponRedemption(mock.tx, { coupon: coupon(), discountMinor: 100, orderId: "order-1", userId: "user-1" });
  assert.equal(mock.queries.length, 1);
  assert.ok(mock.queries[0].sql.includes("CouponRedemption"));
  assert.deepEqual(mock.queries[0].values, ["order-1"]);
  assert.equal(mock.operations.length, 0);
});

test("new redemption inserts an order-scoped row and increments usage once", async () => {
  const mock = fakeTransaction();
  await recordCouponRedemption(mock.tx, { coupon: coupon(), discountMinor: 199, orderId: "order-1", userId: "user-1" });
  assert.equal(mock.queries.length, 1);
  assert.equal(mock.operations.length, 2);
  const [update, insert] = mock.operations;
  assert.match(update.sql, /update "Coupon"/i);
  assert.match(insert.sql, /insert into "CouponRedemption"/i);
  assert.equal(insert.values.includes("order-1"), true);
  assert.equal(insert.values.includes("user-1"), true);
  assert.equal(insert.values.includes(199), true);
  assert.equal(update.values.includes("coupon-1"), true);
});
