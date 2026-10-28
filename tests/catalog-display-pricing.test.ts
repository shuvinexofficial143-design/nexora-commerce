import assert from "node:assert/strict";
import test from "node:test";
import {resolveCompareAtMinor} from "../lib/admin/catalog-pricing";
import {parseCatalogMetadata} from "../lib/admin/catalog-metadata";
import {parseTaxonomyUpdate,parseTaxonomyCreation} from "../lib/admin/product-taxonomy";
import {applyHomepageCategoryDisplay} from "../lib/storefront/homepage-category-display";
import {buildHomepageCollection} from "../lib/storefront/homepage-collection";
test("compare-at price only derives discount reference from explicitly valid rupee amounts",()=>{
  assert.equal(resolveCompareAtMinor(true,1299,99900,null),129900);
  assert.equal(resolveCompareAtMinor(true,"",99900,129900),null);
  assert.equal(resolveCompareAtMinor(true,null,99900,129900),null);
  assert.equal(resolveCompareAtMinor(false,undefined,99900,129900),129900);
  assert.equal(resolveCompareAtMinor(true,999,99900,null),99900);
  for(const price of [-1,998,Infinity,NaN,"1299",1000001])
    assert.throws(()=>resolveCompareAtMinor(true,price,99900,null));
  assert.throws(()=>resolveCompareAtMinor(false,undefined,130000,129900));
});
test("metadata respects Cline schema and only accepts approved HTTPS image URLs",()=>{
  const image="https://images.unsplash.com/photo-111";
  assert.deepEqual(parseCatalogMetadata("category",{description:"  Headphones  ",imageUrl:image}),
    {description:"Headphones",imageUrl:image});
  assert.deepEqual(parseCatalogMetadata("brand",{description:"",logoUrl:null}),
    {description:null,logoUrl:null});
  assert.deepEqual(parseTaxonomyUpdate({kind:"brand",slug:"nexora",description:"Quality",logoUrl:image}).patch,
    {description:"Quality",logoUrl:image});
  assert.deepEqual(parseTaxonomyCreation({kind:"category",name:"Electronics",imageUrl:image}),
    {kind:"category",name:"Electronics",slug:"electronics",imageUrl:image});
  for(const url of ["https://evil.example/image.jpg","http://images.unsplash.com/a",
    "javascript:alert(1)","https://res.cloudinary.com.evil.example/a.png"])
    assert.throws(()=>parseCatalogMetadata("category",{imageUrl:url}));
  assert.throws(()=>parseCatalogMetadata("brand",{logoUrl:"x".repeat(1001)}));
  assert.throws(()=>parseTaxonomyUpdate({kind:"brand",slug:"brand",imageUrl:image}));
  assert.throws(()=>parseTaxonomyUpdate({kind:"category",slug:"cat",description:"x".repeat(501)}));
});
test("homepage shows verified owner category image and order only for actual live categories",()=>{
  const collection=buildHomepageCollection([]);
  const original={...collection,categories:[
    {slug:"fashion",name:"Fashion",image:"/product-placeholder.svg",productCount:3},
    {slug:"tech",name:"Tech",image:"/product-placeholder.svg",productCount:2},
  ]};
  const updated=applyHomepageCategoryDisplay(original,[
    {slug:"fashion",name:"Women's fashion",imageUrl:"https://images.unsplash.com/photo-123",sortOrder:10},
    {slug:"tech",name:"Technology",imageUrl:"https://evil.example/image.jpg",sortOrder:1},
    {slug:"hidden",name:"Must not be added",imageUrl:"https://images.unsplash.com/photo-000",sortOrder:0},
  ]);
  assert.deepEqual(updated.categories.map(c=>c.slug),["tech","fashion"]);
  assert.equal(updated.categories[0].image,"/product-placeholder.svg");
  assert.equal(updated.categories[1].image,"https://images.unsplash.com/photo-123");
  assert.equal(updated.categories[1].name,"Women's fashion");
  assert.equal(updated.categories.length,2);
});
