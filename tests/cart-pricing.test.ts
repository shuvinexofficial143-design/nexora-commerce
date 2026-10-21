import assert from "node:assert/strict";
import test from "node:test";
import { calculateCartDiscount, calculateCartTotals, clampQuantity, FREE_SHIPPING_THRESHOLD, GST_RATE, makeLineId } from "../lib/cart-utils";
import { checkoutTotalWithCoupon } from "../lib/checkout/coupon-total";
import type { CartLine } from "../types/cart";

function line(price: number, quantity = 1): CartLine {
  return { id: "p1", slug: "sample", name: "Sample", brand: "Test", image: "/sample.png", stock: "in-stock", price, quantity, lineId: "p1::default::default" };
}

test("cart line IDs distinguish product variations without collisions", () => {
  assert.equal(makeLineId("p1"), "p1::default::default");
  assert.equal(makeLineId("p1", "red", "M"), "p1::red::M");
  assert.notEqual(makeLineId("p1", "red", "M"), makeLineId("p1", "blue", "M"));
});

test("quantity stays between 1 and 10 and rounds fractional quantities", () => {
  for (const [input, expected] of [[-4, 1], [0, 1], [1.6, 2], [8.1, 8], [100, 10]] as const) {
    assert.equal(clampQuantity(input), expected);
  }
});

test("empty cart has zero totals and no shipping", () => {
  assert.deepEqual(calculateCartTotals([]), { subtotal: 0, discount: 0, shipping: 0, tax: 0, total: 0, itemCount: 0 });
});

test("paid shipping applies below the free-shipping threshold", () => {
  const result = calculateCartTotals([line(FREE_SHIPPING_THRESHOLD - 1)]);
  assert.equal(result.shipping, 99);
  assert.equal(result.tax, Math.round((FREE_SHIPPING_THRESHOLD - 1) * GST_RATE));
  assert.equal(result.total, result.subtotal + result.shipping + result.tax);
});

test("shipping becomes free at the threshold and quantity totals are summed", () => {
  const result = calculateCartTotals([line(400, 2), { ...line(199, 1), id: "p2" }]);
  assert.equal(result.subtotal, 999);
  assert.equal(result.itemCount, 3);
  assert.equal(result.shipping, 0);
});

test("coupons are applied only with a code and never exceed the subtotal", () => {
  assert.equal(calculateCartDiscount(250, -20), 0);
  assert.equal(calculateCartDiscount(250, 500), 250);
  assert.equal(calculateCartTotals([line(250)], undefined, 80).discount, 0);
  const result = calculateCartTotals([line(250)], "SAVE", 500);
  assert.equal(result.discount, 250);
  assert.equal(result.tax, 0);
  assert.equal(result.total, 99);
});

test("checkout coupon totals convert discount minor units to rupees", () => {
  const totals = checkoutTotalWithCoupon(500, 15000);
  assert.deepEqual(totals, { subtotal: 500, discount: 150, shipping: 99, tax: 63, total: 512 });
  const capped = checkoutTotalWithCoupon(500, 99999);
  assert.equal(capped.total, 99);
  assert.equal(capped.tax, 0);
});
