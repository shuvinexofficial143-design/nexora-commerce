import assert from "node:assert/strict";
import test from "node:test";
import { consumeRateLimit } from "../lib/security/rate-limit";

function request(ip?: string, realIp?: string) {
  return new Request("https://nexora.test/api/demo", {
    headers: {
      ...(ip ? { "x-forwarded-for": ip } : {}),
      ...(realIp ? { "x-real-ip": realIp } : {}),
    },
  });
}

test("rate limiting blocks excess requests and returns a retry duration", () => {
  const scope = "qa-limit-budget";
  const req = request("192.0.2.10");
  assert.deepEqual(consumeRateLimit(req, scope, 2, 30_000), { allowed: true, remaining: 1, retryAfterSeconds: 30 });
  assert.deepEqual(consumeRateLimit(req, scope, 2, 30_000), { allowed: true, remaining: 0, retryAfterSeconds: 30 });
  const denied = consumeRateLimit(req, scope, 2, 30_000);
  assert.equal(denied.allowed, false);
  assert.equal(denied.remaining, 0);
  assert.ok(denied.retryAfterSeconds >= 1);
});

test("rate limit keys isolate clients and API scopes", () => {
  const one = request("198.51.100.1");
  const two = request("198.51.100.2");
  assert.equal(consumeRateLimit(one, "qa-login", 1, 60_000).allowed, true);
  assert.equal(consumeRateLimit(one, "qa-login", 1, 60_000).allowed, false);
  assert.equal(consumeRateLimit(two, "qa-login", 1, 60_000).allowed, true);
  assert.equal(consumeRateLimit(one, "qa-order", 1, 60_000).allowed, true);
});

test("first forwarded address takes precedence over later proxy and real-IP values", () => {
  const first = request("203.0.113.40, 10.0.0.1", "10.0.0.2");
  const same = request("203.0.113.40", "10.0.0.9");
  assert.equal(consumeRateLimit(first, "qa-forwarded", 1, 60_000).allowed, true);
  assert.equal(consumeRateLimit(same, "qa-forwarded", 1, 60_000).allowed, false);
});

test("expired rate limit windows reset the quota", (t) => {
  const originalNow = Date.now;
  let current = 10_000;
  Date.now = () => current;
  t.after(() => { Date.now = originalNow; });
  const req = request("192.0.2.50");
  assert.equal(consumeRateLimit(req, "qa-window", 1, 1_000).allowed, true);
  assert.equal(consumeRateLimit(req, "qa-window", 1, 1_000).allowed, false);
  current += 1_000;
  assert.equal(consumeRateLimit(req, "qa-window", 1, 1_000).allowed, true);
});
