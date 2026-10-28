import assert from "node:assert/strict";
import test from "node:test";
import {parseAttributeFilters} from "../lib/storefront/attribute-filters";
import {parseLiveCatalogQuery,catalogPageHref,toProductListQuery} from "../lib/storefront/catalog-query";
test("category-scoped multi-value attrs parse OR inside group, AND between groups",()=>{
  const p=parseAttributeFilters(["electronics.ram:4 GB","electronics.ram:8 GB",
    "electronics.color:blue","electronics.ram:8 GB"]);
  assert.equal(p.invalid,false);
  assert.deepEqual(p.filters,[
    {category:"electronics",slug:"ram",values:["4 GB","8 GB"]},
    {category:"electronics",slug:"color",values:["blue"]},
  ]);
});
test("invalid filters never broaden into unfiltered Shop results",()=>{
  for(const raw of [
    ["electronics.ram:"],["../admin.ram:4 GB"],["electronics.ram:x\nbad"],
    ["electronics.ram:"+"x".repeat(81)],
    Array.from({length:21},(_,i)=>"electronics.ram:"+i),
    Array.from({length:9},(_,i)=>"cat.attr"+i+":blue"),
  ])assert.equal(parseAttributeFilters(raw).invalid,true);
  const query=parseLiveCatalogQuery({attr:"bad-format",sort:"price-low"});
  assert.equal(query.invalidAttributes,true);
  assert.equal(toProductListQuery(query).invalidAttributes,true);
});
test("pagination and price query preserve selected category-scoped attributes",()=>{
  const parsed=parseLiveCatalogQuery({q:"watch",
    category:"electronics",attr:["electronics.ram:8 GB","electronics.colour:blue"],
    page:"3",sort:"price-low",min:"100",stock:"available"});
  const href=catalogPageHref("/shop",parsed,4);
  assert.equal(href.includes("page=4"),true);
  const read=new URL("https://nexora.invalid"+href).searchParams;
  assert.deepEqual(read.getAll("attr"),["electronics.ram:8 GB","electronics.colour:blue"]);
  const next=parseLiveCatalogQuery(Object.fromEntries([...read.keys()].map(key=>{
    const values=read.getAll(key);return [key,values.length>1?values:values[0]];
  })));
  assert.deepEqual(next.attributeFilters,parsed.attributeFilters);
  assert.equal(toProductListQuery(parsed).attributeFilters?.length,2);
  assert.equal(parsed.minPrice,10000);
});
