import assert from "node:assert/strict";
import test from "node:test";
import {
  parseProductChoiceGroups, normalizeChosenOptions, validateChosenOptions,
  deserializeProductChoiceGroups,
} from "../lib/commerce/product-choices";
import { makeLineId } from "../lib/cart-utils";
import { validateOrder } from "../lib/server/backend";

const groups = parseProductChoiceGroups([
  { key: "colour", label: "Colour", required: true, values: [
    { value: "black", label: "Black", available: true },
    { value: "red", label: "Red", available: false },
  ] },
  { key: "pack", label: "Pack size", required: false, values: [
    { value: "single", label: "Single", available: true },
    { value: "double", label: "Double", available: true },
  ] },
]);
const order = {
  items: [{ productId: "test-id", quantity: 1, variant: { colour: "black" } }],
  shippingAddress: { fullName: "QA Customer", phone: "9876543210", line1: "QA Street",
    city: "Indore", state: "MP", postalCode: "452001" },
  contactEmail: "qa@example.invalid", deliveryMethod: "standard", paymentMethod: "cod",
};

test("admin-defined universal choices support required and optional groups", () => {
  assert.equal(groups.length, 2);
  assert.equal(groups[0].sortOrder, 0);
  assert.deepEqual(validateChosenOptions(groups, { colour: "black" }), { colour: "black" });
  assert.deepEqual(validateChosenOptions(groups, { pack: "double", colour: "black" }), { colour: "black", pack: "double" });
  const reread = deserializeProductChoiceGroups(groups);
  assert.deepEqual(reread, groups);
});
test("product choices fail closed for fabricated, disabled, missing or oversized values", () => {
  for (const value of [{}, { colour: "red" }, { colour: "unknown" },
    { colour: "black", size: "xl" }, { colour: "BLACK" }, { colour: "black", pack: "triple" }]) {
    assert.throws(() => validateChosenOptions(groups, value));
  }
  assert.deepEqual(validateChosenOptions([], {}), {});
  assert.throws(() => validateChosenOptions([], { colour: "black" }), /no longer offered/);
  assert.throws(() => normalizeChosenOptions({ key: "a".repeat(100) }));
  assert.throws(() => normalizeChosenOptions({ "prototype.foo": "bar" }));
});
test("admin input enforces bounded, unique option definitions", () => {
  assert.throws(() => parseProductChoiceGroups([{ ...groups[0], values: [] }]));
  assert.throws(() => parseProductChoiceGroups([{ ...groups[0], values: [
    { value: "black", label: "Black", available: false },
  ] }]));
  assert.throws(() => parseProductChoiceGroups([{ ...groups[0], key: "invalid key" }]));
  assert.throws(() => parseProductChoiceGroups([groups[0], groups[0]]));
  assert.throws(() => parseProductChoiceGroups([{ ...groups[0], values: [
    { value: "black", label: "Black", available: true },
    { value: "black", label: "Black again", available: true },
  ] }]));
  assert.throws(() => parseProductChoiceGroups(new Array(9).fill(groups[0])));
});
test("distinct selected combinations are separate persistent cart line identities", () => {
  const a = makeLineId("p1", undefined, undefined, { colour: "black", pack: "single" });
  const b = makeLineId("p1", undefined, undefined, { pack: "single", colour: "black" });
  const c = makeLineId("p1", undefined, undefined, { colour: "black", pack: "double" });
  assert.equal(a, b);
  assert.notEqual(a, c);
});
test("order input normalizes bounded product option values and rejects malformed selection", () => {
  assert.deepEqual(validateOrder(order).items[0].variant, { colour: "black" });
  assert.throws(() => validateOrder({ ...order, items: [{ productId: "p1", quantity: 1,
    variant: { colour: "red", bogus: "../", bad: [] } }] }));
});
