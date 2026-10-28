import assert from "node:assert/strict";
import test from "node:test";
import {normalizeProductGallery,galleryFromMedia,primaryMedia,GALLERY_START,GALLERY_MAX}
 from "../lib/admin/product-gallery";
const base="https://images.unsplash.com/photo-";
test("Cline-compatible gallery contract preserves explicit ordering and alt text",()=>{
  const rows=normalizeProductGallery([base+"111",base+"222"],"QA Watch");
  assert.deepEqual(rows.map(x=>[x.sortOrder,x.alt]),[
    [10,"QA Watch image 1"],[11,"QA Watch image 2"],
  ]);
  assert.equal(GALLERY_START,10);
  assert.equal(GALLERY_MAX,20);
  assert.deepEqual(galleryFromMedia([...rows].reverse()),[base+"111",base+"222"]);
});
test("poster/video selection never treats gallery as poster",()=>{
  const rows=[
    {url:base+"a",sortOrder:10},
    {url:"https://youtu.be/abcdefghijk",sortOrder:1},
    {url:base+"primary",sortOrder:0},
    {url:base+"b",sortOrder:11},
  ];
  assert.deepEqual(primaryMedia(rows),{
    posterUrl:base+"primary",videoUrl:"https://youtu.be/abcdefghijk",
  });
  assert.deepEqual(primaryMedia(rows.filter(x=>x.sortOrder>=10)),{
    posterUrl:null,videoUrl:null,
  });
  assert.deepEqual(galleryFromMedia(rows),[base+"a",base+"b"]);
});
test("gallery enforces exactly 20 extra images and does not rewrite primary media",()=>{
  const images=Array.from({length:20},(_,i)=>base+i);
  assert.equal(normalizeProductGallery(images,"Product").length,20);
  assert.equal(normalizeProductGallery(images,"Product").at(-1)?.sortOrder,29);
  assert.throws(()=>normalizeProductGallery([...images,base+"21"],"Product"),/up to 20/);
});
test("gallery rejects duplicate, untrusted, malformed and video URLs atomically",()=>{
  for(const rows of [
    [base+"a",base+"a"],["http://images.unsplash.com/test"],
    ["https://evil.example/foo.jpg"],["javascript:alert(1)"],
    ["https://youtu.be/abcdefghijk"],[{alt:"fake"}],
    [base+"x".repeat(1510)],
  ])assert.throws(()=>normalizeProductGallery(rows,"Test"));
  assert.throws(()=>normalizeProductGallery("not-array","Test"),/array|20 images/);
});
