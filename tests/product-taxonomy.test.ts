import assert from "node:assert/strict";
import test from "node:test";
import { parseTaxonomyCreation, parseTaxonomySelection, validTaxonomySlug } from "../lib/admin/product-taxonomy";
test("catalog options validate explicit categories and brand, no raw IDs or invalid slugs", () => {
  assert.deepEqual(parseTaxonomySelection({categorySlug:"electronics",brandSlug:"northline"}),
    { categorySlug:"electronics", brandSlug:"northline" });
  assert.deepEqual(parseTaxonomySelection({categorySlug:"",brandSlug:null}),
    {categorySlug:null,brandSlug:null});
  assert.deepEqual(parseTaxonomySelection({ name:"X" }),{});
  for(const raw of [{categorySlug:"../admin"},{categorySlug:"BAD CAPS"},{brandSlug:77},{brandSlug:"a".repeat(65)}])
    assert.throws(()=>parseTaxonomySelection(raw));
  assert.equal(validTaxonomySlug("home-accessories"),"home-accessories");
});
test("catalog option creation is bounded; title-derived safe slugs",()=>{
  assert.deepEqual(parseTaxonomyCreation({kind:"category",name:"Home & Living"}),{
    kind:"category",name:"Home & Living",slug:"home-and-living",
  });
  assert.deepEqual(parseTaxonomyCreation({kind:"brand",name:"Gold Star",slug:"gold-star"}),{
    kind:"brand",name:"Gold Star",slug:"gold-star",
  });
  for(const raw of [null,{},[],{kind:"seller",name:"New"}, {kind:"brand",name:""}, 
    {kind:"brand",name:" ".repeat(4)},{kind:"brand",name:"a".repeat(81)},
    {kind:"brand",name:"Gold Star",slug:"../bad"},{kind:"brand",name:"हिंदी"}])
    assert.throws(()=>parseTaxonomyCreation(raw));
});
