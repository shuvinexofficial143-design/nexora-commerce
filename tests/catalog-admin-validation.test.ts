import assert from "node:assert/strict";
import test from "node:test";
import { normalizeGallery } from "../lib/admin/product-admin";
import { validateProductAttributes } from "../lib/admin/catalog-admin";

const definitions = [
  { slug: "material", name: "Material", type: "SELECT", required: true, active: true, options: ["Cotton", "Silk"] },
  { slug: "washable", name: "Washable", type: "BOOLEAN", required: false, active: true, options: null },
  { slug: "tags", name: "Tags", type: "MULTI_SELECT", required: false, active: true, options: ["New", "Gift"] },
];

test("product attributes validate against category definitions and discard unknown keys", () => {
  assert.deepEqual(validateProductAttributes(definitions, { material: "Cotton", washable: true, unknown: "ignored" }), { material: "Cotton", washable: true });
  assert.throws(() => validateProductAttributes(definitions, { material: "Wool" }), /invalid value/);
  assert.throws(() => validateProductAttributes(definitions, {}), /Material is required/);
  assert.throws(() => validateProductAttributes(definitions, { material: "Silk", tags: ["Gift", "Bad"] }), /invalid values/);
});

test("product gallery accepts approved HTTPS media and assigns stable order", () => {
  assert.deepEqual(normalizeGallery([
    "https://images.unsplash.com/photo-1",
    { url: "https://res.cloudinary.com/demo/image/upload/gift.png", alt: "Gift detail" },
  ], "Gift"), [
    { url: "https://images.unsplash.com/photo-1", alt: "Gift image 1", sortOrder: 10 },
    { url: "https://res.cloudinary.com/demo/image/upload/gift.png", alt: "Gift detail", sortOrder: 11 },
  ]);
  assert.throws(() => normalizeGallery(["http://example.com/image.jpg"], "Gift"), /HTTPS from/);
  assert.throws(() => normalizeGallery(["https://images.unsplash.com/photo-1", "https://images.unsplash.com/photo-1"], "Gift"), /unique/);
});