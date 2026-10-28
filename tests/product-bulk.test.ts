import assert from "node:assert/strict";
import test from "node:test";
import { BulkProductConflict,parseBulkProductRequest } from "../lib/admin/product-bulk";
const now="2026-10-28T10:00:00.000Z";
const one={id:"product-1",updatedAt:now};
test("Cline-compatible action names and revision-pinned product requests",()=>{
  for(const action of ["PUBLISH","MOVE_TO_DRAFT","FEATURE","UNFEATURE"])
    assert.deepEqual(parseBulkProductRequest({action,products:[one]}),{action,products:[one]});
  assert.equal(parseBulkProductRequest({action:"FEATURE",
    products:Array.from({length:25},(_,i)=>({id:String(i),updatedAt:now}))}).products.length,25);
});
test("no unreviewed delete, inventory, price or arbitrary bulk action",()=>{
  for(const request of [
    {action:"DELETE",products:[one]}, {action:"PUBLISH",products:[one],price:0},
    {action:"FEATURE",products:[{...one,stock:500}]},
    {action:"PUBLISH",products:[{id:one.id,updatedAt:now,attributes:{ram:"4GB"}}]},
  ])assert.throws(()=>parseBulkProductRequest(request));
});
test("rejects empty/oversized batches and duplicate IDs before any SQL",()=>{
  for(const items of [[],[one,one],
    Array.from({length:26},(_,i)=>({id:String(i),updatedAt:now}))]){
    assert.throws(()=>parseBulkProductRequest({action:"PUBLISH",products:items}));
  }
});
test("rejects stale/forged/invalid timestamps and unexpected ID types",()=>{
  for(const selected of [
    {id:"a",updatedAt:"2026-02-30T10:00:00.000Z"},
    {id:"a",updatedAt:"yesterday"}, {id:123,updatedAt:now},
    {id:"",updatedAt:now}, {id:"x".repeat(129),updatedAt:now},
    {id:"a",updatedAt:"2026-10-28T10:00:00Z"},
  ])assert.throws(()=>parseBulkProductRequest({action:"PUBLISH",products:[selected]}));
});
test("concurrency conflicts are explicit, not silent partial success",()=>{
  const failure=new BulkProductConflict();
  assert.equal(failure.name,"BulkProductConflict");
  assert.match(failure.message,/Refresh/);
});
