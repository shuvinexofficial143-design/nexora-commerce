import assert from "node:assert/strict";
import test from "node:test";
import { validateOwnerOrderStatus, validateOrderTransition } from "../lib/admin/order-status";
import { PATCH as sharedPatch } from "../app/api/admin-app/orders/[orderId]/status/route";
import { PATCH as detailPatch } from "../app/api/admin-app/orders/[orderId]/route";

test("both owner order endpoints use the identical transition handler", () => {
  assert.strictEqual(detailPatch, sharedPatch);
});

test("generic owner PATCH rejects refunds and return status shortcuts", () => {
  for (const status of ["RETURN_REQUESTED", "RETURNED", "REFUNDED", "", 1, null, "paid"]) {
    assert.throws(() => validateOwnerOrderStatus(status), /Invalid order status/);
  }
  assert.equal(validateOwnerOrderStatus("DELIVERED"), "DELIVERED");
});

test("status transitions are monotonic and terminal fulfillment is immutable", () => {
  const pending = { status: "PENDING", paymentMethod: "cod", paymentStatus: "PENDING" };
  assert.equal(validateOrderTransition(pending, "DELIVERED"), "update");
  assert.equal(validateOrderTransition(pending, "PENDING"), "unchanged");
  assert.throws(() => validateOrderTransition({ ...pending, status: "SHIPPED" }, "PACKED"), /backwards/);
  assert.throws(() => validateOrderTransition({ ...pending, status: "CANCELLED" }, "DELIVERED"), /Terminal/);
  assert.throws(() => validateOrderTransition({ ...pending, status: "DELIVERED" }, "CANCELLED"), /Terminal/);
  assert.throws(() => validateOrderTransition({ ...pending, status: "RETURN_REQUESTED" }, "CANCELLED"), /Terminal/);
});

test("unpaid Cashfree orders cannot advance but can be cancelled", () => {
  const current = { status: "PENDING", paymentMethod: "cashfree", paymentStatus: "PENDING" };
  assert.throws(() => validateOrderTransition(current, "PROCESSING"), /payment is confirmed/);
  assert.equal(validateOrderTransition(current, "CANCELLED"), "update");
  assert.equal(validateOrderTransition({ ...current, paymentStatus: "PAID" }, "PROCESSING"), "update");
});
