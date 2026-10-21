import assert from "node:assert/strict";
import test from "node:test";
import { apiError, ok, validateLogin, validateOrder, validateRegistration } from "../lib/server/backend";
import { ConflictError, DatabaseNotConfiguredError, NotFoundError, ValidationError } from "../lib/db/errors";

const valid = () => ({
  items: [{ productId: "product-1", quantity: 2 }],
  shippingAddress: {
    fullName: " Customer Test ", phone: "9876543210", line1: "12 Main Road",
    city: "Indore", state: "MP", postalCode: "452001",
  },
  contactEmail: "  Buyer@Example.COM ",
  paymentMethod: "cod",
  deliveryMethod: "standard",
});

test("registration trims name, normalizes email and enforces password length", () => {
  const data = validateRegistration({ name: "  Customer Test  ", email: "  User@Example.Com  ", password: "validpass123", phone: "" });
  assert.equal(data.name, "Customer Test");
  assert.equal(data.email, "user@example.com");
  assert.equal(data.phone, undefined);
  for (const invalid of [
    { name: "a", email: "u@test.com", password: "validpass123" },
    { name: "Valid", email: "bad address", password: "validpass123" },
    { name: "Valid", email: "u@test.com", password: "1234567" },
  ]) assert.throws(() => validateRegistration(invalid), ValidationError);
});

test("login rejects missing credentials and canonicalizes emails", () => {
  assert.deepEqual(validateLogin({ email: "  USER@Example.com ", password: "hello" }), { email: "user@example.com", password: "hello" });
  for (const input of [{ email: "", password: "hi" }, { email: "a@b.co" }, null])
    assert.throws(() => validateLogin(input), ValidationError);
});

test("order validation accepts valid COD order and defaults safely", () => {
  const order = validateOrder(valid());
  assert.equal(order.items[0].quantity, 2);
  assert.equal(order.contactEmail, "buyer@example.com");
  assert.equal(order.paymentMethod, "cod");
  assert.equal(order.deliveryMethod, "standard");
  assert.equal(order.shippingAddress.country, "India");
  assert.equal(order.shippingAddress.fullName, "Customer Test");
});

test("cart must contain a nonempty array and shipping address must exist", () => {
  for (const input of [null, {}, { items: [] }, { items: [{ productId: "p", quantity: 1 }] }])
    assert.throws(() => validateOrder(input), ValidationError);
});

test("order rejects fractional, negative, zero, excessive and nonnumeric quantities", () => {
  for (const quantity of [0, -1, 1.1, 21, NaN, Infinity, "invalid"]) {
    assert.throws(() => validateOrder({ ...valid(), items: [{ productId: "p", quantity }] }), ValidationError, String(quantity));
  }
  assert.equal(validateOrder({ ...valid(), items: [{ productId: "p", quantity: 20 }] }).items[0].quantity, 20);
});

test("order rejects blank product IDs and required address fields", () => {
  assert.throws(() => validateOrder({ ...valid(), items: [{ productId: "", quantity: 1 }] }), ValidationError);
  for (const field of ["fullName", "phone", "line1", "city", "state", "postalCode"]) {
    const order = valid();
    assert.throws(() => validateOrder({ ...order, shippingAddress: { ...order.shippingAddress, [field]: "  " } }), ValidationError, field);
  }
});

test("checkout requires a well-formed contact email and recognized payment/delivery methods", () => {
  for (const email of ["", "abc", "a@b", "a b@test.com"]) {
    assert.throws(() => validateOrder({ ...valid(), contactEmail: email }), ValidationError);
  }
  assert.throws(() => validateOrder({ ...valid(), paymentMethod: "wallet" }), /payment method/i);
  assert.throws(() => validateOrder({ ...valid(), deliveryMethod: "teleport" }), /delivery method/i);
});

test("cashfree payment requires configured credentials", (t) => {
  const id = process.env.CASHFREE_CLIENT_ID;
  const secret = process.env.CASHFREE_CLIENT_SECRET;
  delete process.env.CASHFREE_CLIENT_ID;
  delete process.env.CASHFREE_CLIENT_SECRET;
  t.after(() => {
    if (id === undefined) delete process.env.CASHFREE_CLIENT_ID; else process.env.CASHFREE_CLIENT_ID = id;
    if (secret === undefined) delete process.env.CASHFREE_CLIENT_SECRET; else process.env.CASHFREE_CLIENT_SECRET = secret;
  });
  assert.throws(() => validateOrder({ ...valid(), paymentMethod: "cashfree" }), /not configured/);
});

test("customer-controlled coupon and notes are normalized and bounded", () => {
  const order = validateOrder({ ...valid(), coupon: "  save10  ", notes: "a".repeat(900) });
  assert.equal(order.coupon, "SAVE10");
  assert.equal(order.notes?.length, 500);
  assert.equal(validateOrder({ ...valid(), coupon: "x".repeat(50) }).coupon?.length, 40);
});

test("known backend errors use correct HTTP status and generic unexpected errors hide details", async (t) => {
  const cases: Array<[Error, number]> = [
    [new ValidationError("Bad input"), 400],
    [new ConflictError("Conflict"), 409],
    [new NotFoundError(), 404],
    [new DatabaseNotConfiguredError(), 503],
  ];
  for (const [error, status] of cases) {
    const response = apiError(error);
    assert.equal(response.status, status);
    assert.deepEqual(await response.json(), { ok: false, error: error.message });
  }
  const original = console.error;
  console.error = () => {};
  t.after(() => { console.error = original; });
  const unexpected = apiError(new Error("internal database credentials=secret"));
  assert.equal(unexpected.status, 500);
  assert.deepEqual(await unexpected.json(), { ok: false, error: "Unexpected server error." });
});

test("success envelopes preserve explicit 201 status", async () => {
  const response = ok({ id: "sample" }, { status: 201 });
  assert.equal(response.status, 201);
  assert.deepEqual(await response.json(), { ok: true, data: { id: "sample" } });
});
