import assert from "node:assert/strict";
import test from "node:test";
import { buildCartAdmissionRequest, assertCartAdmission } from "../lib/commerce/cart-admission";
import type { CartLine, CartProductSnapshot } from "../types/cart";
import type { CheckoutPreview } from "../lib/commerce/checkout-preview";

const product: CartProductSnapshot = { id:"p1",slug:"shirt",name:"Shirt",brand:"QA",
  image:"/product-placeholder.svg",stock:"low-stock",price:1299 };
const cart=(choices:Record<string,string>, quantity:number):CartLine =>
  ({...product,lineId:JSON.stringify(choices),quantity,choices});
const quote=(quantity:number, stock:number):CheckoutPreview => ({
  valid:true,changedPrice:false,issues:[],currency:"INR",
  lines:[{slug:product.slug,productId:product.id,variantId:"sku1",sku:"SHIRT-BLK",
    name:product.name,quantity,options:{colour:"black",size:"m"},availableStock:stock,
    unitPriceMinor:129900,lineTotalMinor:129900*quantity,changedPrice:false,state:"available"}],
  subtotalMinor:129900*quantity,discountMinor:0,shippingMinor:0,taxMinor:0,
  totalMinor:129900*quantity,deliveryMethod:"standard",couponApplied:false,
  verifiedAt:"2026-10-27T00:00:00Z",
});
test("SKU admission combines only same choice signature and refuses 20-unit overflow",()=>{
  const lines=[cart({colour:"black",size:"m"},2),cart({colour:"white",size:"m"},1)];
  const input=buildCartAdmissionRequest(product,{size:"m",colour:"black"},lines);
  assert.equal(input.items[0].quantity,3);
  assert.equal(input.items[0].clientPriceMinor,129900);
  assert.deepEqual(input.items[0].options,{colour:"black",size:"m"});
  assert.equal(buildCartAdmissionRequest(product,{colour:"red"},lines).items[0].quantity,1);
  assert.throws(()=>buildCartAdmissionRequest(product,{},[cart({},20)]),/20 units/);
  assert.throws(()=>buildCartAdmissionRequest(product,{},[],11),/1 and 10/);
  assert.throws(()=>buildCartAdmissionRequest(product,{colour:"bad value"},[]));
});
test("SKU admission rejects price change, sold-out quantity and invalid server quote",()=>{
  const req=buildCartAdmissionRequest(product,{colour:"black",size:"m"},
    [cart({colour:"black",size:"m"},2)]);
  assert.doesNotThrow(()=>assertCartAdmission(quote(3,3),req));
  assert.throws(()=>assertCartAdmission(quote(3,2),req),/quantity/);
  assert.throws(()=>assertCartAdmission({...quote(3,3),changedPrice:true},req),/price changed/);
  assert.throws(()=>assertCartAdmission({...quote(3,3),lines:[
    {...quote(3,3).lines[0],unitPriceMinor:130000}]},req),/price changed/);
  assert.throws(()=>assertCartAdmission({...quote(3,3),lines:[
    {...quote(3,3).lines[0],quantity:1}]},req),/verify/);
  assert.throws(()=>assertCartAdmission({...quote(3,3),valid:false,
    issues:["Disabled SKU"]},req),/Disabled SKU/);
});
