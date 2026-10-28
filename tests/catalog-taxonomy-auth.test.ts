import assert from "node:assert/strict";
import test from "node:test";
import { PATCH } from "../app/api/admin-app/product-taxonomy/route";

test("Unauthenticated category visibility PATCH is rejected before DB write",async()=>{
  const result=await PATCH(new Request("http://localhost:3137/api/admin-app/product-taxonomy",{
    method:"PATCH",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({kind:"category",slug:"electronics",visible:false}),
  }));
  assert.equal(result.status,401);
  const payload=await result.json() as {ok:boolean};
  assert.equal(payload.ok,false);
});
test("Unauthenticated brand deactivation PATCH is also rejected",async()=>{
  const result=await PATCH(new Request("http://localhost:3137/api/admin-app/product-taxonomy",{
    method:"PATCH",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({kind:"brand",slug:"apex",active:false}),
  }));
  assert.equal(result.status,401);
});
