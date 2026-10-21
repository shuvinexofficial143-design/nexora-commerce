import assert from "node:assert/strict";
import test from "node:test";
import { POST as login } from "../app/api/auth/login/route";
import { POST as register } from "../app/api/auth/register/route";
import { GET as adminHealth, OPTIONS as adminHealthOptions } from "../app/api/admin-app/health/route";
import { POST as validateCouponRoute } from "../app/api/coupons/validate/route";
import { POST as resolveProductsRoute } from "../app/api/backend/products/resolve/route";

function post(path: string, value: unknown) {
  return new Request("http://localhost:3137" + path, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(value),
  });
}

test("disabled public customer auth returns 404 without DB or password checks", async (t) => {
  const before = process.env.PUBLIC_CUSTOMER_AUTH_ENABLED;
  delete process.env.PUBLIC_CUSTOMER_AUTH_ENABLED;
  t.after(() => { if (before === undefined) delete process.env.PUBLIC_CUSTOMER_AUTH_ENABLED; else process.env.PUBLIC_CUSTOMER_AUTH_ENABLED = before; });
  const a = await login(post("/api/auth/login", { email: "qa@example.test", password: "invalid" }));
  const b = await register(post("/api/auth/register", { name: "QA", email: "qa@example.test", password: "invalid" }));
  for (const response of [a, b]) {
    assert.equal(response.status, 404);
    assert.deepEqual(await response.json(), { ok: false, error: "Customer accounts are disabled." });
  }
});

test("admin health rejects anonymous callers before database connection", async () => {
  const response = await adminHealth(new Request("http://localhost:3137/api/admin-app/health"));
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { ok: false, error: "Admin authorization required." });
  assert.equal(response.headers.get("cache-control"), "no-store");
});

test("admin CORS preflight blocks external browser origins", async () => {
  const response = adminHealthOptions(new Request("http://localhost:3137/api/admin-app/health", {
    method: "OPTIONS", headers: { Origin: "https://attacker.example" },
  }));
  assert.equal(response.status, 403);
  assert.equal(response.headers.get("access-control-allow-origin"), null);
});

test("coupon endpoint rejects blank codes and invalid totals without DB", async () => {
  const cases = [
    { code: "" },
    { code: "LONG".repeat(11), subtotal: 50 },
    { code: "PROMO", subtotal: -1 },
    { code: "PROMO", subtotal: "not-a-number" },
    { code: "PROMO", subtotal: 10000001 },
  ];
  for (const payload of cases) {
    const response = await validateCouponRoute(post("/api/coupons/validate", payload));
    assert.equal(response.status, 400, JSON.stringify(payload));
    const body = await response.json();
    assert.equal(body.ok, false);
  }
});

test("product resolution rejects empty product slug lists without DB", async () => {
  for (const payload of [{}, { slugs: [] }, { slugs: ["", " "] }]) {
    const response = await resolveProductsRoute(post("/api/backend/products/resolve", payload));
    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { ok: false, error: "At least one product slug is required." });
  }
});
