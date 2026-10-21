import assert from "node:assert/strict";
import test from "node:test";
import { hashPassword, verifyPassword } from "../lib/auth/password";
import { ownerAdminConfigured, verifyOwnerCredentials } from "../lib/admin/owner-auth";
import { adminCorsHeaders, adminFailure, adminJson, adminOptions, adminUnexpected } from "../lib/admin/admin-api";

test("password hashing uses fresh random salts and verifies only the correct password", async () => {
  const a = await hashPassword("long-secure-password");
  const b = await hashPassword("long-secure-password");
  assert.match(a, /^scrypt\$[0-9a-f]+\$[0-9a-f]+$/);
  assert.notEqual(a, b);
  assert.equal(await verifyPassword("long-secure-password", a), true);
  assert.equal(await verifyPassword("wrong-password", a), false);
  assert.equal(await verifyPassword("long-secure-password", "plaintext"), false);
});

test("admin credential check rejects missing setup and wrong credentials", (t) => {
  const oldUser = process.env.ADMIN_USERNAME;
  const oldPass = process.env.ADMIN_PASSWORD;
  t.after(() => {
    if (oldUser === undefined) delete process.env.ADMIN_USERNAME; else process.env.ADMIN_USERNAME = oldUser;
    if (oldPass === undefined) delete process.env.ADMIN_PASSWORD; else process.env.ADMIN_PASSWORD = oldPass;
  });
  delete process.env.ADMIN_USERNAME;
  delete process.env.ADMIN_PASSWORD;
  assert.equal(ownerAdminConfigured(), false);
  assert.equal(verifyOwnerCredentials("owner", "correct-password"), false);
  process.env.ADMIN_USERNAME = "owner";
  process.env.ADMIN_PASSWORD = "correct-password";
  assert.equal(ownerAdminConfigured(), true);
  assert.equal(verifyOwnerCredentials("owner", "correct-password"), true);
  assert.equal(verifyOwnerCredentials("other", "correct-password"), false);
  assert.equal(verifyOwnerCredentials("owner", "wrong"), false);
});

test("admin CORS only reflects allowlisted origins, never arbitrary websites", (t) => {
  const original = process.env.ADMIN_APP_ORIGINS;
  t.after(() => { if (original === undefined) delete process.env.ADMIN_APP_ORIGINS; else process.env.ADMIN_APP_ORIGINS = original; });
  process.env.ADMIN_APP_ORIGINS = "https://admin.nexora.example";
  const bad = new Request("http://localhost/api/admin-app/health", { headers: { origin: "https://evil.example" } });
  const good = new Request("http://localhost/api/admin-app/health", { headers: { origin: "https://admin.nexora.example" } });
  assert.equal("Access-Control-Allow-Origin" in adminCorsHeaders(bad), false);
  assert.equal(adminCorsHeaders(good)["Access-Control-Allow-Origin"], "https://admin.nexora.example");
  assert.equal(adminCorsHeaders(good)["Cache-Control"], "no-store");
  assert.equal(adminCorsHeaders(good)["X-Content-Type-Options"], "nosniff");
});

test("unauthorized admin preflight gets 403 while allowlisted native origin gets 204", async () => {
  const denied = adminOptions(new Request("http://localhost/api/admin-app/health", { method: "OPTIONS", headers: { origin: "https://evil.example" } }));
  assert.equal(denied.status, 403);
  assert.deepEqual(await denied.json(), { ok: false, error: "Origin not allowed." });
  const allowed = adminOptions(new Request("http://localhost/api/admin-app/health", { method: "OPTIONS", headers: { origin: "capacitor://localhost" } }));
  assert.equal(allowed.status, 204);
  assert.equal(allowed.headers.get("access-control-allow-origin"), "capacitor://localhost");
});

test("admin failure and JSON responses keep CORS protections", async () => {
  const req = new Request("http://localhost/admin", { headers: { origin: "https://untrusted.example" } });
  const failed = adminFailure(req, "Not authorized", 401);
  assert.equal(failed.status, 401);
  assert.equal(failed.headers.get("access-control-allow-origin"), null);
  assert.deepEqual(await failed.json(), { ok: false, error: "Not authorized" });
  const success = adminJson(req, { online: true });
  assert.equal(success.status, 200);
  assert.deepEqual(await success.json(), { ok: true, data: { online: true } });
});

test("unexpected admin exceptions never expose internal stack or secrets", async (t) => {
  const orig = console.error;
  console.error = () => {};
  t.after(() => { console.error = orig; });
  const request = new Request("http://localhost/admin");
  const response = adminUnexpected(request, new Error("secret database password"));
  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), { ok: false, error: "Unexpected admin server error." });
});
