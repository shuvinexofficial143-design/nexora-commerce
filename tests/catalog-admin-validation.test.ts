import assert from "node:assert/strict";
import test from "node:test";
import { normalizeGallery } from "../lib/admin/product-admin";
import { normalizeCatalogSortOrder, requireAssignableBrand, requireAssignableCategory, validateProductAttributes } from "../lib/admin/catalog-admin";

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

test("required category attributes reject omitted/null product attribute payloads", () => {
  assert.throws(() => validateProductAttributes(definitions, null), /Material is required/);
  assert.throws(() => validateProductAttributes(definitions, undefined), /Material is required/);
  assert.deepEqual(validateProductAttributes([{ ...definitions[0], required: false }], null), {});
});

test("catalog display order accepts bounded integers and rejects silent coercion", () => {
  assert.equal(normalizeCatalogSortOrder(undefined, 5), 5);
  assert.equal(normalizeCatalogSortOrder(0), 0);
  assert.equal(normalizeCatalogSortOrder(-10), -10);
  for (const value of ["12", 1.2, Number.POSITIVE_INFINITY, 100001, -100001]) {
    assert.throws(() => normalizeCatalogSortOrder(value), /Display order must be an integer/);
  }
});


test("product assignment rejects hidden/archived categories and inactive brands", () => {
  assert.equal(requireAssignableCategory({ id: "c1", archived: false, visible: true }), "c1");
  assert.throws(() => requireAssignableCategory({ id: "c1", archived: true, visible: false }), /active, visible category/);
  assert.throws(() => requireAssignableCategory({ id: "c1", archived: false, visible: false }), /active, visible category/);
  assert.throws(() => requireAssignableCategory(null), /active, visible category/);
  assert.equal(requireAssignableBrand({ id: "b1", active: true }), "b1");
  assert.throws(() => requireAssignableBrand({ id: "b1", active: false }), /active brand/);
  assert.throws(() => requireAssignableBrand(null), /active brand/);
});
