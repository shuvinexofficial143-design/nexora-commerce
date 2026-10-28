import assert from "node:assert/strict";
import test from "node:test";
import { parseBulkProductRequest } from "../lib/admin/product-bulk";

const date = "2026-10-28T10:00:00.000Z";
test("bulk action accepts 1..25 revision-pinned unique product IDs", () => {
  assert.deepEqual(parseBulkProductRequest({ action: "PUBLISH", products: [{ id: "p1", updatedAt: date }] }), {
    action: "PUBLISH", products: [{ id: "p1", updatedAt: date }],
  });
  assert.equal(parseBulkProductRequest({
    action: "UNFEATURE", products: Array.from({ length: 25 }, (_, i) => ({ id: String(i), updatedAt: date })),
  }).products.length, 25);
  assert.throws(() => parseBulkProductRequest({ action: "PUBLISH", products: [] }), /between 1 and 25/);
  assert.throws(() => parseBulkProductRequest({
    action: "PUBLISH", products: Array.from({ length: 26 }, (_, i) => ({ id: String(i), updatedAt: date })),
  }), /between 1 and 25/);
});
test("bulk action rejects injection, invalid revisions, duplicates and unsupported actions", () => {
  assert.throws(() => parseBulkProductRequest({ action: "DELETE", products: [{ id: "a", updatedAt: date }] }), /Unsupported/);
  assert.throws(() => parseBulkProductRequest({ action: "FEATURE", ids: ["a"], products: [{ id: "a", updatedAt: date }] }), /Unsupported/);
  assert.throws(() => parseBulkProductRequest({
    action: "PUBLISH", products: [{ id: "a", updatedAt: date, stock: 100 }],
  }), /Invalid product selection/);
  assert.throws(() => parseBulkProductRequest({
    action: "PUBLISH", products: [{ id: "a", updatedAt: date }, { id: "a", updatedAt: date }],
  }), /Duplicate/);
  assert.throws(() => parseBulkProductRequest({ action: "FEATURE", products: [{ id: "a", updatedAt: "yesterday" }] }), /Invalid/);
  assert.throws(() => parseBulkProductRequest({ action: "FEATURE", products: [{ id: "a", updatedAt: "2026-02-30T10:00:00.000Z" }] }), /Invalid/);
});
