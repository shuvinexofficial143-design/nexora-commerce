import assert from "node:assert/strict";
import test from "node:test";
import {verifySuccessfulCashfreePayment} from "../lib/payments/cashfree";

const order={totalMinor:129900,currency:"INR"};
test("strict Cashfree success proof requires exact matching amount, INR and gateway id",()=>{
  assert.equal(verifySuccessfulCashfreePayment({
    payment_status:"SUCCESS",payment_amount:1299,
    payment_currency:"INR",cf_payment_id:123456,
  },order),"123456");
  assert.equal(verifySuccessfulCashfreePayment({
    payment_amount:1299,payment_currency:"INR",cf_payment_id:"cf-001",
  },order),"cf-001");
});
test("missing payment_amount, currency or gateway ID must never turn order PAID",()=>{
  for(const missing of [
    {payment_currency:"INR",cf_payment_id:"p1"},
    {payment_amount:1299,cf_payment_id:"p1"},
    {payment_amount:1299,payment_currency:"INR"},
    {payment_amount:"1299",payment_currency:"INR",cf_payment_id:"p1"},
    {payment_amount:0,payment_currency:"INR",cf_payment_id:"p1"},
    {payment_amount:Infinity,payment_currency:"INR",cf_payment_id:"p1"},
    {payment_amount:1299,payment_currency:"INR",cf_payment_id:""},
  ])assert.throws(()=>verifySuccessfulCashfreePayment(missing,order),/payment|currency|gateway/i);
});
test("underpayment, overpayment, fractional paise, non-INR and unsafe values fail closed",()=>{
  for(const amount of [1298.99,1299.01,1299.001,1298.999,100000000000000])
    assert.throws(()=>verifySuccessfulCashfreePayment({
      payment_amount:amount,payment_currency:"INR",cf_payment_id:"p1",
    },order),/amount/);
  for(const currency of ["USD","inr","",undefined])
    assert.throws(()=>verifySuccessfulCashfreePayment({
      payment_amount:1299,payment_currency:currency,cf_payment_id:"p1",
    },order),/currency/);
});
