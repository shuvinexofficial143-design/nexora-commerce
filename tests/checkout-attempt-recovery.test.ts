import assert from "node:assert/strict";
import test from "node:test";
import { validateCheckoutRecoveryRequest } from "../lib/commerce/checkout-attempt-recovery";
const key = "9fa0e34a-07e1-4ab5-b77b-a8d0a793a250";
test("recovery accepts bounded email + high-entropy checkout key only", () => {
  assert.deepEqual(validateCheckoutRecoveryRequest({
    email: " TEST@example.invalid ", key,
  }), { email: "test@example.invalid", key });
  for (const input of [null, [], {}, {email:"x@example.invalid"},
    {email:"x@example.invalid",key:"short"},
    {email:"not-email",key}, {email:"a".repeat(260)+"@example.invalid",key},
    {email:"x@example.invalid",key:"../orders"}])
    assert.throws(() => validateCheckoutRecoveryRequest(input));
});
