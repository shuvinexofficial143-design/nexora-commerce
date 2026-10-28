import assert from "node:assert/strict";
import test from "node:test";
import { parseTaxonomyCreation,parseTaxonomyUpdate } from "../lib/admin/product-taxonomy";
import { publicProductVisibilityWhere } from "../lib/commerce/catalog-visibility";

test("Cline-compatible nested category creation validates parent and brand limits",()=>{
  const category=parseTaxonomyCreation({kind:"category",name:"Kids Wear",parentSlug:"fashion"});
  assert.equal(category.parentSlug,"fashion");
  assert.deepEqual(parseTaxonomyCreation({kind:"brand",name:"Apex"}),{
    kind:"brand",name:"Apex",slug:"apex",
  });
  for(const input of [{kind:"brand",name:"Apex",parentSlug:"fashion"},
    {kind:"category",name:"Kids",parentSlug:"../admin"},
    {kind:"category",name:"Kids",parentSlug:42}])
    assert.throws(()=>parseTaxonomyCreation(input));
});
test("Catalog state PATCH accepts only permitted typed visibility fields",()=>{
  const cat=parseTaxonomyUpdate({kind:"category",slug:"electronics",visible:false,archived:true,parentSlug:null,sortOrder:8});
  assert.deepEqual(cat.patch,{visible:false,archived:true,parentSlug:null,sortOrder:8});
  const brand=parseTaxonomyUpdate({kind:"brand",slug:"apex",active:false,featured:true});
  assert.deepEqual(brand.patch,{active:false,featured:true});
  for(const raw of [{kind:"category",slug:"electronics"},
    {kind:"brand",slug:"apex",visible:true},
    {kind:"category",slug:"electronics",sortOrder:1.5},
    {kind:"category",slug:"electronics",visible:"false"},
    {kind:"category",slug:"../admin",visible:false},
    {kind:"category",slug:"electronics",parentSlug:"//evil"},
    {kind:"brand",slug:"apex",priceMinor:0}])
    assert.throws(()=>parseTaxonomyUpdate(raw));
});
test("Prisma visibility policy never reveals category other than eligible IDs",()=>{
  const empty=publicProductVisibilityWhere([]);
  const json=JSON.stringify(empty);
  assert.ok(json.includes('"categoryId":null'));
  assert.ok(json.includes('"in":[]'));
  assert.ok(json.includes('"active":true'));
  const active=publicProductVisibilityWhere(["c1","c2"]);
  assert.ok(JSON.stringify(active).includes('"c1"'));
});
