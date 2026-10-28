import assert from "node:assert/strict";
import test from "node:test";
import { serializeAdminProductListRow, type AdminListProduct } from "../lib/admin/product-list-row";
const base: AdminListProduct = {
  id:"p1",slug:"teeshirt",sku:"BASE-TS",name:"T-shirt",description:"Real product",
  priceMinor:49900,compareAtMinor:59900,status:"ACTIVE",featured:true,
  updatedAt:new Date("2026-10-28T00:00:00.000Z"),
  brand:{name:"Apex",slug:"apex"},category:{name:"Fashion",slug:"fashion"},
  images:[{url:"https://example.invalid/image.jpg",alt:"Actual image",sortOrder:0}],
  inventory:[{onHand:100,reserved:1}],
  variants:[],
};
test("Cline-compatible Admin metadata retains slugs, featured, base price and details",()=>{
  const x=serializeAdminProductListRow(base);
  assert.equal(x.brandSlug,"apex");
  assert.equal(x.categorySlug,"fashion");
  assert.equal(x.description,"Real product");
  assert.equal(x.featured,true);
  assert.equal(x.compareAtMinor,59900);
  assert.equal(x.priceMinor,49900);
  assert.equal(x.effectivePriceMinor,49900);
  assert.equal(x.availableStock,99);
  assert.equal(x.stockSource,"warehouse");
  assert.equal(x.media.length,1);
});
test("SKU product uses only active SKU stock and minimum active price, not parent warehouse",()=>{
  const x=serializeAdminProductListRow({...base,variants:[
    {priceMinor:129900,onHand:5,reserved:2,active:true},
    {priceMinor:159900,onHand:2,reserved:1,active:true},
    {priceMinor:100,onHand:1000,reserved:0,active:false},
  ]});
  assert.equal(x.priceMinor,49900,"Admin still edits saved base price");
  assert.equal(x.effectivePriceMinor,129900);
  assert.equal(x.stockSource,"sku");
  assert.equal(x.totalVariantCount,3);
  assert.equal(x.activeVariantCount,2);
  assert.equal(x.skuOnHand,7);
  assert.equal(x.skuReserved,3);
  assert.equal(x.availableStock,4);
  assert.equal(x.onHand,100,"Legacy warehouse count remains separate");
});
test("retired all-SKU product shows zero saleable units and no fake starting price",()=>{
  const x=serializeAdminProductListRow({...base,variants:[
    {priceMinor:100,onHand:999,reserved:0,active:false}
  ]});
  assert.equal(x.stockSource,"sku");
  assert.equal(x.availableStock,0);
  assert.equal(x.effectivePriceMinor,null);
  assert.equal(x.activeVariantCount,0);
});
test("available counts clamp negative mismatched stock and sum bins, not net parent totals",()=>{
  const x=serializeAdminProductListRow({...base,inventory:[
    {onHand:1,reserved:3},{onHand:4,reserved:1}
  ],variants:[]});
  assert.equal(x.availableStock,3);
  assert.equal(x.onHand,5);
  assert.equal(x.reserved,4);
});
