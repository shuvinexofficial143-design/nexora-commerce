import assert from "node:assert/strict";
import test from "node:test";
import { validateOrder } from "../lib/server/backend";
import { validateIdempotencyKey } from "../lib/db/orders";
import { POST as postOrder } from "../app/api/backend/orders/route";

const base = {
  items: [{ productId: "product-1", quantity: 1 }],
  shippingAddress: {
    fullName: "QA Customer", phone: "+91 98765 43210", line1: "12 Test Street",
    city: "Indore", state: "Madhya Pradesh", postalCode: "452001",
  },
  contactEmail: "buyer@sample.test", paymentMethod: "cod", deliveryMethod: "standard",
};

test("validates and normalizes Indian phone and PIN", () => {
  const validated = validateOrder(base);
  assert.equal(validated.shippingAddress.phone, "9876543210");
  assert.equal(validated.shippingAddress.postalCode, "452001");
});
test("rejects invalid Indian mobile and PIN inputs", () => {
  for (const phone of ["not-a-phone", "0000000000", "1234567890", "+11234567890", "987654321"]) {
    assert.throws(() => validateOrder({ ...base, shippingAddress: { ...base.shippingAddress, phone } }), /mobile number/);
  }
  for (const postalCode of ["invalid", "000000", "12345", "1234567", "12A456"]) {
    assert.throws(() => validateOrder({ ...base, shippingAddress: { ...base.shippingAddress, postalCode } }), /PIN code|postalCode/);
  }
});
test("limits address length and cumulative product demand", () => {
  assert.throws(() => validateOrder({ ...base, shippingAddress: { ...base.shippingAddress, fullName: "X".repeat(101) } }));
  assert.throws(() => validateOrder({ ...base, items: [{ productId: "product-1", quantity: 20 }, { productId: "product-1", quantity: 1 }] }));
  assert.doesNotThrow(() => validateOrder({ ...base, items: [{ productId: "product-1", quantity: 10 }, { productId: "product-1", quantity: 10 }] }));
});
test("idempotency key format allows UUIDs but rejects missing, whitespace or short tokens", () => {
  assert.equal(validateIdempotencyKey("12345678-1234-1234-1234-123456789abc"), "12345678-1234-1234-1234-123456789abc");
  for (const key of ["", "short", "a b c", "x".repeat(129)]) {
    assert.throws(() => validateIdempotencyKey(key));
  }
});
test("HTTP checkout rejects missing attempt key before database/user creation", async () => {
  const request = new Request("http://localhost:3137/api/backend/orders", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify(base),
  });
  const response = await postOrder(request);
  assert.equal(response.status, 400);
  const result = await response.json();
  assert.equal(result.ok, false);
  assert.match(result.error, /Idempotency-Key/);
});
