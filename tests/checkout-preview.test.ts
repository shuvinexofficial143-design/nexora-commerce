import assert from "node:assert/strict";
import test from "node:test";
import { validateCheckoutPreview } from "../lib/commerce/checkout-preview";
import { calculateAuthoritativeTotals } from "../lib/commerce/order-pricing";
import { validateOrder } from "../lib/server/backend";
import { checkoutPreviewSignature, checkoutPreviewRequest } from "../lib/api/checkout-preview-client";
import type { CheckoutPreview } from "../lib/commerce/checkout-preview";
import type { CartLine } from "../types/cart";

const line = { slug: "keyboard-pro", quantity: 1, clientPriceMinor: 129900 };
test("preview only accepts bounded active-cart product references", () => {
  assert.deepEqual(validateCheckoutPreview({ items: [line] }), { items: [{ ...line, options: {} }], deliveryMethod: "standard" });
  for (const input of [
    null, {}, { items: [] }, { items: [{ ...line, slug: "../admin" }] },
    { items: [{ ...line, quantity: 0 }] },
    { items: [{ ...line, quantity: 1.5 }] },
    { items: [{ ...line, quantity: 21 }] },
    { items: [{ ...line, clientPriceMinor: -2 }] },
    { items: [{ ...line, clientPriceMinor: Number.NaN }] },
    { items: [{ ...line }, { ...line, quantity: 20 }] },
    { items: Array.from({ length: 51 }, () => line) },
  ]) assert.throws(() => validateCheckoutPreview(input));
});
test("paid express/priority delivery cannot be claimed without actual serviceability", () => {
  for (const method of ["express", "priority", "premium", "FREE!"]) {
    assert.throws(() => validateCheckoutPreview({ items: [line], deliveryMethod: method }));
  }
  assert.throws(() => validateOrder({
    items: [{ productId: "test-id", quantity: 1 }],
    shippingAddress: { fullName: "QA Customer", phone: "9876543210", line1: "Test address",
      city: "Indore", state: "MP", postalCode: "452001" },
    contactEmail: "qa@example.invalid", paymentMethod: "cod", deliveryMethod: "priority",
  }));
});
test("order rejects forged or non-integer expected prices",()=>{
  const base={items:[{productId:"p1",quantity:1,expectedUnitPriceMinor:-1}],
    shippingAddress:{fullName:"QA Customer",phone:"9876543210",line1:"Test address",
      city:"Indore",state:"MP",postalCode:"452001"},
    contactEmail:"qa@example.invalid",paymentMethod:"cod",deliveryMethod:"standard"};
  assert.throws(()=>validateOrder(base),/Invalid verified product price/);
  assert.throws(()=>validateOrder({...base,items:[{productId:"p1",quantity:1,expectedUnitPriceMinor:2.2}]}));
});
test("server pricing is consistent for standard shipping threshold and GST", () => {
  const below = calculateAuthoritativeTotals({ subtotalMinor: 99899, discountMinor: 0, deliveryMethod: "standard" });
  const above = calculateAuthoritativeTotals({ subtotalMinor: 99900, discountMinor: 0, deliveryMethod: "standard" });
  assert.equal(below.shippingMinor, 9900);
  assert.equal(above.shippingMinor, 0);
  assert.equal(above.taxMinor, 17982);
  assert.equal(above.totalMinor, 117882);
  const discount = calculateAuthoritativeTotals({ subtotalMinor: 100000, discountMinor: 10000, deliveryMethod: "standard" });
  assert.equal(discount.taxMinor, 16200);
  assert.equal(discount.totalMinor, 106200);
  for (const value of [-1, Infinity, NaN]) assert.throws(() =>
    calculateAuthoritativeTotals({ subtotalMinor: value, discountMinor: 0, deliveryMethod: "standard" }));
});
test("checkout preview is not a payment or order; signature ignores verification time but detects price/stock", () => {
  const original: CheckoutPreview = {
    valid: true, changedPrice: false, lines: [{
      slug: "keyboard-pro", productId: "test-id", variantId: null, sku: "KB-QA", name: "Keyboard", quantity: 1, options: {}, availableStock: 5,
      unitPriceMinor: 10000, lineTotalMinor: 10000, changedPrice: false, state: "available",
    }],
    subtotalMinor: 10000, discountMinor: 0, shippingMinor: 9900, taxMinor: 1800, totalMinor: 21700,
    currency: "INR", issues: [], couponApplied: false, deliveryMethod: "standard",
    verifiedAt: new Date().toISOString(),
  };
  assert.equal(checkoutPreviewSignature(original), checkoutPreviewSignature({ ...original, verifiedAt: "later" }));
  assert.notEqual(checkoutPreviewSignature(original), checkoutPreviewSignature({
    ...original, lines: original.lines.map(row => ({ ...row, availableStock: 4 })),
  }));
  assert.notEqual(checkoutPreviewSignature(original), checkoutPreviewSignature({ ...original, totalMinor: 21800 }));
});
test("cart preview sends only slug quantity and quoted price, never private checkout details", () => {
  const data: CartLine[] = [{
    id: "p123", lineId: "p123::black::xl", slug: "keyboard-pro", name: "Keyboard",
    brand: "Brand", image: "/product-placeholder.svg", price: 1299, stock: "in-stock",
    quantity: 2, color: "black", size: "xl",
  }];
  const payload = checkoutPreviewRequest(data, "", "standard");
  assert.deepEqual(payload, { items: [{ slug: "keyboard-pro", quantity: 2, clientPriceMinor: 129900 }], deliveryMethod: "standard" });
  assert.equal(JSON.stringify(payload).includes("black"), false);
});
