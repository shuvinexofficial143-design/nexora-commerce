import assert from "node:assert/strict";
import test from "node:test";
import { buildHomepageCollection } from "../lib/storefront/homepage-collection";
import type { CatalogProduct } from "../types/catalog";
function product(slug:string, options:Partial<CatalogProduct>={}):CatalogProduct{
  return {
    id:slug, slug, name:slug, brand:"Auralab",category:"electronics",price:1000,
    rating:0,reviews:0,image:"/product-placeholder.svg",
    stock:"in-stock",inventory:4,delivery:"At checkout",popularity:5,
    createdAt:"2026-10-01T00:00:00Z",tags:[],colors:[],...options,
  };
}
test("Homepage only returns actual published inputs; no invented categories or products",()=>{
  const result=buildHomepageCollection([]);
  assert.deepEqual(result.categories,[]);
  assert.deepEqual(result.recent,[]);
  assert.deepEqual(result.discover,[]);
  assert.equal(result.spotlight,null);
  assert.deepEqual(result.brands,[]);
});
test("Homepage counts actual categories and brands and routes to real catalog filters",()=>{
  const rows=[
    product("new-a",{category:"home-accessories",createdAt:"2026-10-22T00:00:00Z",image:"/one.jpg"}),
    product("old-b",{category:"electronics",createdAt:"2026-07-22T00:00:00Z"}),
    product("new-a",{category:"electronics",createdAt:"2026-10-23T00:00:00Z"}), // duplicate slug is ignored
    product("new-c",{category:"home-accessories",brand:"Acme",createdAt:"2026-10-25T00:00:00Z"}),
  ];
  const x=buildHomepageCollection(rows);
  assert.deepEqual(x.categories.map(c=>[c.slug,c.name,c.productCount]),[
    ["home-accessories","Home Accessories",2],["electronics","Electronics",1]]);
  assert.equal(x.spotlight?.slug,"new-c");
  assert.deepEqual(x.recent.map(p=>p.slug),["new-c","new-a","old-b"]);
  assert.equal(x.brands.find(b=>b.name==="Auralab")?.count,2);
  assert.ok(x.brands.find(b=>b.name==="Acme")?.href.includes("%20")===false);
});
test("No out-of-stock/retired SKU can appear in featured or new-arrival tiles",()=>{
  const x=buildHomepageCollection([
    product("sold",{stock:"out-of-stock",inventory:0,createdAt:"2026-10-26"}),
    product("reserved",{stock:"low-stock",inventory:0,createdAt:"2026-10-27"}),
    product("ready",{createdAt:"2026-10-22"}),
  ]);
  assert.equal(x.spotlight?.slug,"ready");
  assert.deepEqual(x.recent.map(p=>p.slug),["ready"]);
  assert.equal(x.categories[0].productCount,3);
});
test("Invalid URL slugs cannot enter homepage products or category links",()=>{
  const x=buildHomepageCollection([
    product("../bad",{category:"../bad"}),
    product("good",{category:"../bad",brand:"Unbranded"}),
  ]);
  assert.deepEqual(x.recent.map(p=>p.slug),["good"]);
  assert.equal(x.categories.length,0);
  assert.equal(x.brands.length,0);
});
