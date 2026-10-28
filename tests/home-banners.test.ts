import assert from "node:assert/strict";
import test from "node:test";
import { validateBanner, validateBannerLink } from "../lib/home-banners";
const image="https://images.unsplash.com/photo-1523275335684-37898b6baf30";
const valid={
  title:"Weekend favourites",description:"New items worth a look",
  imageUrl:image,mobileImageUrl:null,
  ctaText:"Shop now",ctaHref:"/shop?category=electronics",
  categorySlug:"electronics",sortOrder:3,published:true,archived:false,
};
test("homepage banner preserves Cline-compatible persisted fields and safe internal CTA",()=>{
  const x=validateBanner(valid);
  assert.deepEqual(x,valid);
  assert.equal(validateBannerLink("/search?q=smart%20watch"),"/search?q=smart%20watch");
  assert.equal(validateBannerLink("/product/example-headphones"),"/product/example-headphones");
  assert.equal(validateBannerLink("/track-order"),"/track-order");
});
test("CMS banner rejects open redirects, traversal, bad protocols and unknown routes",()=>{
  for(const href of [
    "https://evil.example/","//evil.example","/\\evil.example","/admin",
    "/api/backend/orders","/checkout","/product/../admin","/shop#javascript",
    "/shop?redirect=https://evil.example","/shop%2F..%2Fadmin",
    "javascript:alert(1)","/shop\r\nX-Evil:1",
  ]) assert.throws(()=>validateBannerLink(href),href);
});
test("CMS accepts only approved HTTPS banner images and bounded customer text",()=>{
  for(const imageUrl of [
    "http://images.unsplash.com/photo","https://127.0.0.1/foo",
    "https://example.invalid/a.png","data:image/svg+xml;base64,xxx",
    "javascript:alert(1)","https://res.cloudinary.com.evil.com/photo.jpg",
  ]) assert.throws(()=>validateBanner({...valid,imageUrl}),imageUrl);
  for(const raw of [
    {...valid,title:"x"}, {...valid,title:"x".repeat(121)},
    {...valid,ctaText:"x".repeat(41)},
    {...valid,description:"x".repeat(351)},
    {...valid,categorySlug:"../admin"},
    {...valid,sortOrder:-1},{...valid,sortOrder:1.5},
    {...valid,published:"false"},{...valid,archived:"yes"},
    {...valid,mobileImageUrl:"http://localhost/image"},
  ]) assert.throws(()=>validateBanner(raw));
});
test("CMS does not publish archived banner even if stale input says published",()=>{
  const row=validateBanner({...valid,archived:true});
  assert.equal(row.archived,true);
  assert.equal(row.published,false);
  assert.equal(validateBanner({...valid,description:null,categorySlug:null}).description,null);
  assert.equal(validateBanner({...valid,description:null,categorySlug:null}).categorySlug,null);
});
test("CMS rejects missing/array/null input before querying any database",()=>{
  for(const raw of [null,[],{},42,"banner"])assert.throws(()=>validateBanner(raw));
});
