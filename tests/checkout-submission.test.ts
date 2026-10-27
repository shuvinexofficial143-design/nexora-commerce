import assert from "node:assert/strict";
import test from "node:test";
import { checkoutIntentSignature, checkoutIntentDigest, parsePendingOnlineOrder, verifiedCheckoutOrderItems } from "../lib/commerce/checkout-submission";
import type { CartLine } from "../types/cart";
import type { CheckoutPreview } from "../lib/commerce/checkout-preview";

const item = (slug: string, choices: Record<string,string> = {}, quantity = 1): CartLine => ({
  id: "id-" + slug, slug, lineId: slug + JSON.stringify(choices), name: "QA Item",
  brand: "QA", image: "/product-placeholder.svg", price: 399, stock: "in-stock",
  quantity, choices,
});
const quote = (lines: CartLine[]): CheckoutPreview => ({
  valid: true, changedPrice: false, issues: [], couponApplied: false,
  verifiedAt: "2026-10-27T00:00:00.000Z", currency: "INR", deliveryMethod: "standard",
  subtotalMinor: lines.reduce((n,l)=>n+l.quantity*39900,0),
  discountMinor:0,shippingMinor:0,taxMinor:0,totalMinor:0,
  lines:lines.map((line,index)=>({
    slug:line.slug,quantity:line.quantity,options:line.choices??{},
    productId:line.id,variantId:"v" + index,sku:"SKU-" + index,
    name:line.name,availableStock:5,unitPriceMinor:39900,
    lineTotalMinor:39900*line.quantity,state:"available",changedPrice:false,
  })),
});
const address={ id:"home",label:"Home",fullName:"QA Customer",phone:"9876543210",
  line1:"House 1",city:"Indore",state:"MP",postalCode:"452001",country:"India" };
const draft=(lines:CartLine[])=>({
  lines,coupon:"SAVE10",paymentId:"cashfree" as const,deliveryId:"standard",
  email:"QA@example.invalid",address,
});
test("checkout signature tracks SKU, quantity, price, address, contact, delivery, coupon and payment changes",()=>{
  const line=item("shirt",{colour:"blue",size:"m"});
  const a=checkoutIntentSignature(draft([line]));
  assert.equal(a,checkoutIntentSignature(draft([item("shirt",{size:"m",colour:"blue"})])));
  assert.notEqual(a,checkoutIntentSignature(draft([item("shirt",{colour:"blue",size:"m"},2)])));
  assert.notEqual(a,checkoutIntentSignature(draft([{...line,price:400}])));
  assert.notEqual(a,checkoutIntentSignature({...draft([line]),coupon:"OTHER"}));
  assert.notEqual(a,checkoutIntentSignature({...draft([line]),paymentId:"cod"}));
  assert.notEqual(a,checkoutIntentSignature({...draft([line]),deliveryId:"express"}));
  assert.notEqual(a,checkoutIntentSignature({...draft([line]),email:"another@example.invalid"}));
  assert.notEqual(a,checkoutIntentSignature({...draft([line]),address:{...address,postalCode:"462001"}}));
});
test("pending payment recovery accepts only validated order reference and nonreversible intent digest",async()=>{
  const digest=await checkoutIntentDigest(checkoutIntentSignature(draft([item("shirt")])));
  assert.match(digest,/^[a-f0-9]{64}$/);
  const saved={orderNumber:"NX-20261027-ABCDEF12",email:"qa@example.invalid",digest};
  assert.deepEqual(parsePendingOnlineOrder(JSON.stringify(saved)),saved);
  for(const bad of ["no",JSON.stringify({...saved,digest:"no"}),JSON.stringify({...saved,orderNumber:"../../admin"}),
    JSON.stringify({...saved,email:"bad"}),JSON.stringify([]), "x".repeat(1100)]) {
    assert.equal(parsePendingOnlineOrder(bad),null);
  }
  assert.notEqual(digest,await checkoutIntentDigest(checkoutIntentSignature(draft([item("other")]))));
});
test("server quote order-item builder preserves exact SKU mapping and refuses stale/misaligned preview",()=>{
  const lines=[item("shirt",{colour:"blue"}),item("shirt",{colour:"red"}),item("hat")];
  const verified=quote(lines);
  const items=verifiedCheckoutOrderItems(lines,verified);
  assert.deepEqual(items.map(x=>x.productId),lines.map(x=>x.id));
  assert.deepEqual(items.map(x=>x.variant),lines.map(x=>x.choices));
  assert.deepEqual(items.map(x=>x.expectedUnitPriceMinor),[39900,39900,39900]);
  const fail=(change:Partial<CheckoutPreview>)=>assert.throws(
    ()=>verifiedCheckoutOrderItems(lines,{...verified,...change}),/verification|no longer matches/i);
  fail({valid:false});fail({changedPrice:true});
  fail({lines:verified.lines.slice(0,2)});
  fail({lines:[verified.lines[1],verified.lines[0],verified.lines[2]]});
  fail({lines:[{...verified.lines[0],options:{colour:"white"}},...verified.lines.slice(1)]});
  fail({lines:[{...verified.lines[0],unitPriceMinor:40000},...verified.lines.slice(1)]});
  fail({lines:[{...verified.lines[0],state:"insufficient_stock"},...verified.lines.slice(1)]});
  fail({lines:[{...verified.lines[0],availableStock:0},...verified.lines.slice(1)]});
  fail({lines:[{...verified.lines[0],productId:null},...verified.lines.slice(1)]});
});
