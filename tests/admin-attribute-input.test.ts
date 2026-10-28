import assert from "node:assert/strict";
import test from "node:test";
import {
  activeProductAttributes, normalizeAttributeDraft, type ProductAttributeDefinition,
} from "../lib/admin/attribute-input";

const defs: ProductAttributeDefinition[] = [
  { id: "ram", categoryId: "electronics", slug: "ram", name: "RAM", type: "NUMBER", required: true, active: true, options: [] },
  { id: "color", categoryId: "electronics", slug: "color", name: "Color", type: "SELECT", required: true, active: true, options: ["Black", "Silver"] },
  { id: "wifi", categoryId: "electronics", slug: "wifi", name: "Wi-Fi", type: "BOOLEAN", required: false, active: true, options: [] },
  { id: "warranty", categoryId: "electronics", slug: "warranty", name: "Warranty", type: "DATE", required: false, active: true, options: [] },
  { id: "tags", categoryId: "electronics", slug: "tags", name: "Tags", type: "MULTI_SELECT", required: false, active: true, options: ["Gift", "New"] },
  { id: "custom", categoryId: "gifts", slug: "custom", name: "Custom Message", type: "IMAGE_REQUEST", required: false, active: true, options: [] },
];

test("category filtering prevents unrelated draft attributes leaking across categories", () => {
  assert.deepEqual(activeProductAttributes(defs, "gifts").map(d => d.slug), ["custom"]);
  assert.deepEqual(activeProductAttributes(defs, "electronics").map(d => d.slug), ["ram", "color", "wifi", "warranty", "tags"]);
  assert.deepEqual(activeProductAttributes(defs, undefined), []);
});

test("type-aware editor conversion preserves false and converts numeric strings", () => {
  assert.deepEqual(normalizeAttributeDraft(activeProductAttributes(defs, "electronics"), {
    ram: "8", color: "Silver", wifi: false, tags: ["New", "New", "Gift"], ignored: "not persisted",
  }), { ram: 8, color: "Silver", wifi: false, tags: ["New", "Gift"] });
});
test("editor rejects missing required, invalid number, invalid option and invalid date", () => {
  const fields = activeProductAttributes(defs, "electronics");
  assert.throws(() => normalizeAttributeDraft(fields, { color: "Black" }), /RAM is required/);
  assert.throws(() => normalizeAttributeDraft(fields, { ram: "abc", color: "Black" }), /RAM must be a number/);
  assert.throws(() => normalizeAttributeDraft(fields, { ram: "8", color: "Gold" }), /invalid selection/);
  assert.throws(() => normalizeAttributeDraft(fields, { ram: 8, color: "Black", warranty: "2026-02-31" }), /valid date/);
});
test("customization instructions persist as a gift-only optional text value", () => {
  assert.deepEqual(normalizeAttributeDraft(activeProductAttributes(defs, "gifts"), { custom: "  Happy Birthday  " }), { custom: "Happy Birthday" });
});
