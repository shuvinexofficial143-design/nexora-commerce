import assert from "node:assert/strict";
import test from "node:test";
import { ApiClientError, apiFetch } from "../lib/api/http";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

test("API client returns successful envelope data and includes JSON headers", async (t) => {
  const before = globalThis.fetch;
  t.after(() => { globalThis.fetch = before; });
  let requestInit: RequestInit | undefined;
  globalThis.fetch = async (_input, init) => {
    requestInit = init;
    return json({ ok: true, data: { id: "order-1" } });
  };

  const data = await apiFetch<{ id: string }>("/api/backend/orders", { method: "POST", body: JSON.stringify({ id: 1 }) });
  assert.deepEqual(data, { id: "order-1" });
  assert.equal(requestInit?.credentials, "same-origin");
  assert.equal(requestInit?.cache, "no-store");
  assert.equal(new Headers(requestInit?.headers).get("Accept"), "application/json");
  assert.equal(new Headers(requestInit?.headers).get("Content-Type"), "application/json");
});

test("API client returns backend validation messages and response status", async (t) => {
  const before = globalThis.fetch;
  t.after(() => { globalThis.fetch = before; });
  globalThis.fetch = async () => json({ ok: false, error: "Invalid coupon" }, 400);
  await assert.rejects(apiFetch("/api/coupons/validate"), (error: unknown) =>
    error instanceof ApiClientError && error.status === 400 && error.message === "Invalid coupon");
});

test("API client rejects unsuccessful envelopes even on HTTP 200", async (t) => {
  const before = globalThis.fetch;
  t.after(() => { globalThis.fetch = before; });
  globalThis.fetch = async () => json({ ok: false, error: "Unauthorized" });
  await assert.rejects(apiFetch("/api/auth/session"), (error: unknown) =>
    error instanceof ApiClientError && error.status === 200 && error.message === "Unauthorized");
});

test("API client reports invalid JSON and network failures safely", async (t) => {
  const before = globalThis.fetch;
  t.after(() => { globalThis.fetch = before; });
  globalThis.fetch = async () => new Response("<html>error</html>", { status: 502 });
  await assert.rejects(apiFetch("/api/test"), (error: unknown) =>
    error instanceof ApiClientError && error.status === 502);
  globalThis.fetch = async () => { throw new Error("secret upstream failure"); };
  await assert.rejects(apiFetch("/api/test"), (error: unknown) =>
    error instanceof ApiClientError && error.status === 0 && error.message === "Could not reach the NEXORA backend.");
});
