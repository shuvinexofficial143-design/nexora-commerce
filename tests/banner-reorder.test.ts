import assert from "node:assert/strict";
import test from "node:test";
import { parseBannerReorder,BannerReorderConflict } from "../lib/admin/banner-order";
const stamp="2026-10-28T12:00:00.000Z";
const a={id:"banner-one",updatedAt:stamp},b={id:"banner-two",updatedAt:stamp};
test("Cline-compatible reorder accepts only a bounded list of revision-pinned banners",()=>{
  assert.deepEqual(parseBannerReorder({items:[a,b]}),[a,b]);
  assert.equal(parseBannerReorder({items:Array.from({length:100},(_,i)=>({
    id:"banner-"+i,updatedAt:stamp,
  }))}).length,100);
});
test("unknown fields, duplicates, forged timestamps and invalid counts fail before querying DB",()=>{
  for(const raw of [
    null,{},[],{items:[a]},{items:[a,a]}, {items:[a,b],force:true},
    {items:[a,{...b,updatedAt:"2026-02-30T12:00:00.000Z"}]},
    {items:[a,{...b,updatedAt:"2026-10-28T12:00:00Z"}]},
    {items:[a,{...b,id:"//unsafe"}]},
    {items:[a,{...b,id:""}]},
    {items:[a,{...b,updatedAt:123}]},
    {items:[a,{...b,sortOrder:0}]},
    {items:Array.from({length:101},(_,i)=>({id:"x"+i,updatedAt:stamp}))},
  ])assert.throws(()=>parseBannerReorder(raw));
  assert.match(new BannerReorderConflict().message,/Refresh/);
});
