import assert from "node:assert/strict";
import test from "node:test";
import { adjustStock } from "../lib/admin/inventory-admin";
import { POST } from "../app/api/admin-app/inventory/adjust/route";

test("stock adjustment rejects coercion, missing IDs and unbounded values before database access", async () => {
  for (const input of [
    {}, {inventoryId: "a", delta: "5", note: "valid reason"},
    {inventoryId: "a", delta: true, note: "valid reason"},
    {inventoryId: "a", delta: 0, note: "valid reason"},
    {inventoryId: "a", delta: 0.5, note: "valid reason"},
    {inventoryId: "a", delta: Number.NaN, note: "valid reason"},
    {inventoryId: "a", delta: Number.POSITIVE_INFINITY, note: "valid reason"},
    {inventoryId: "a", delta: 100_001, note: "valid reason"},
    {inventoryId: "a", delta: -100_001, note: "valid reason"},
    {inventoryId: "a", delta: 1, note: "  "},
    {inventoryId: "a", delta: 1, note: ["forged"]},
    {inventoryId: "a".repeat(130), delta: 1, note: "valid reason"},
  ]) await assert.rejects(adjustStock(input), /bounded stock adjustment/);
  for (const owner of ["", "  ", "x".repeat(129)]) {
    await assert.rejects(adjustStock({
      inventoryId: "test", delta: 1, note: "valid reason",
    }, owner), /Invalid admin identity/);
  }
});

test("stock adjustment endpoint rejects request without Owner authorization", async () => {
  const response = await POST(new Request("http://localhost:3137/api/admin-app/inventory/adjust", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ inventoryId: "placeholder", delta: 3, note: "test" }),
  }));
  assert.equal(response.status, 401);
  assert.equal((await response.json() as { ok: boolean }).ok, false);
});
