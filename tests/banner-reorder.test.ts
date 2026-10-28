import assert from "node:assert/strict";
import test from "node:test";
import { parseBannerReorder } from "../lib/admin/banner-order";

const at = "2026-10-28T11:00:00.000Z";
const valid = { items: [{ id: "b1", updatedAt: at }, { id: "b2", updatedAt: at }] };
test("banner reordering accepts only unique active revision-pinned IDs", () => {
  assert.deepEqual(parseBannerReorder(valid), valid.items);
  assert.throws(() => parseBannerReorder({ items: [valid.items[0]] }), /2 and 100/);
  assert.throws(() => parseBannerReorder({ items: [valid.items[0], valid.items[0]] }), /Duplicate/);
  assert.throws(() => parseBannerReorder({ items: [valid.items[0], { id: "b2", updatedAt: "yesterday" }] }), /revision/);
  assert.throws(() => parseBannerReorder({ items: [valid.items[0], { id: "b2", updatedAt: at, archived: true }] }), /revision/);
  assert.throws(() => parseBannerReorder({ ...valid, force: true }), /2 and 100/);
});
