#!/usr/bin/env node
// Read-only and rejection-path smoke checks, restricted to a local web server.
// No accounts, orders, payments, database writes, or external endpoints.
import assert from "node:assert/strict";

const base = new URL(process.env.NEXORA_QA_BASE_URL || "http://127.0.0.1:3137");
if (!["localhost", "127.0.0.1", "::1", "[::1]"].includes(base.hostname)) {
  console.error("QA smoke tests refuse non-local hosts.");
  process.exit(2);
}
if (!["http:", "https:"].includes(base.protocol) || base.username || base.password || base.search || base.hash || base.pathname !== "/") {
  console.error("QA smoke test base URL must be a local site root without credentials.");
  process.exit(2);
}

async function send(path, options = {}) {
  const url = new URL(path, base);
  assert.equal(url.origin, base.origin, "smoke checks must remain local");
  const res = await fetch(url, { redirect: "manual", cache: "no-store", signal: AbortSignal.timeout(12_000), ...options });
  return res;
}

async function waitForServer() {
  for (let n = 0; n < 40; n++) {
    try {
      const response = await send("/");
      if (response.status === 200) return;
    } catch { /* Next.js may still be starting */ }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error("Local Nexora server did not become healthy within startup polling window.");
}

async function check(name, path, status, options, inspect) {
  const response = await send(path, options);
  assert.equal(response.status, status, name + " returned status " + response.status);
  assert.equal(response.headers.get("location"), null, "unexpected external redirect");
  if (inspect) await inspect(response);
  console.log("PASS", name, response.status);
}

await waitForServer();
await check("home", "/", 200);
await check("shop", "/shop", 200);
await check("backend health with unconfigured local DB", "/api/backend/health", 200, {}, async (r) => {
  const body = await r.json();
  assert.equal(body.ok, true);
  assert.equal(body.data.configured, false);
  assert.equal(body.data.database, "not-configured");
});
await check("anonymous admin access forbidden", "/api/admin-app/health", 401, {}, async (r) => {
  const body = await r.json();
  assert.equal(body.ok, false);
  assert.equal(body.error, "Admin authorization required.");
});
await check("admin untrusted origin forbidden", "/api/admin-app/health", 403, {
  method: "OPTIONS", headers: { Origin: "https://external-qa.invalid" },
}, async (r) => { assert.equal(r.headers.get("access-control-allow-origin"), null); });
await check("disabled customer login", "/api/auth/login", 404, {
  method: "POST", headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "qa-nonexistent@example.invalid", password: "wrong" }),
});
await check("invalid coupon cannot reach database", "/api/coupons/validate", 400, {
  method: "POST", headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ code: "", subtotal: -1 }),
});
await check("missing slugs cannot reach database", "/api/backend/products/resolve", 400, {
  method: "POST", headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ slugs: [] }),
});
console.log("PASS: 8 local HTTP smoke checks, no browser or production services used.");
