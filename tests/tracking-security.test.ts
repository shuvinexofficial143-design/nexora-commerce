import assert from "node:assert/strict";
import test from "node:test";
import { GET } from "../app/api/backend/orders/track/route";
import {
  hashAccessToken,
  normalizeTrackingToken,
  orderTrackingGuidance,
  TrackingInputError,
  validateTrackingCode,
  validateTrackingIdentity,
} from "../lib/orders/secure-tracking";

test("tracking identity validates order format and email without disclosing orders", () => {
  assert.deepEqual(
    validateTrackingIdentity({ orderNumber: " nx-20261021-abcd1234 ", email: "  QA@Example.COM " }),
    { orderNumber: "NX-20261021-ABCD1234", email: "qa@example.com" },
  );
  for (const data of [
    { orderNumber: "", email: "a@b.com" },
    { orderNumber: "secret-id", email: "a@b.com" },
    { orderNumber: "NX-20261021-ABCDEF12", email: "invalid" },
    { orderNumber: "NX-20261021-ABCDEF12", email: "x".repeat(255) + "@a.com" },
  ]) assert.throws(() => validateTrackingIdentity(data), TrackingInputError);
});
test("verification accepts six digits and standard UUID, rejects malformed inputs", () => {
  const challengeId = "0f9df77b-8ce6-4c4a-8667-6bea2ca24db8";
  assert.deepEqual(validateTrackingCode({ challengeId, code: " 039201 " }), { challengeId, code: "039201" });
  assert.throws(() => validateTrackingCode({ challengeId, code: "00000" }));
  assert.throws(() => validateTrackingCode({ challengeId, code: "9999999" }));
  assert.throws(() => validateTrackingCode({ challengeId: "abc", code: "039201" }));
});
test("random bearer token is checked strictly and never accepted as URL lookup", () => {
  const token = "a".repeat(43);
  assert.equal(normalizeTrackingToken("Bearer " + token), token);
  for (const header of [null, "", "Basic " + token, "Bearer short", "Bearer " + token + "x y"]) {
    assert.equal(normalizeTrackingToken(header), null);
  }
  assert.notEqual(hashAccessToken(token), token);
});
test("tracking messaging never promises cancellation, refunds or fabricated courier events", () => {
  assert.match(orderTrackingGuidance("PENDING").cancellation, /request cancellation/);
  assert.match(orderTrackingGuidance("SHIPPED").returns, /request a return review/);
  assert.match(orderTrackingGuidance("DELIVERED").returns, /subject to/);
  assert.doesNotMatch(orderTrackingGuidance("RETURN_REQUESTED").returns, /guaranteed/i);
});
test("legacy order+email GET is unauthorized without verified access, without DB query", async () => {
  const response = await GET(new Request("http://127.0.0.1/api/backend/orders/track?order=NX-20261021-ABCDEF12&email=qa@example.test"));
  assert.equal(response.status, 401);
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  const data = await response.json();
  assert.equal(data.ok, false);
  assert.equal(JSON.stringify(data).includes("shippingAddress"), false);
});
