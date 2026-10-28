import assert from "node:assert/strict";
import test from "node:test";
import {POST} from "../app/api/admin-app/products/bulk/route";
const url="http://localhost:3137/api/admin-app/products/bulk";
test("bulk mutations reject unauthorized owner requests before any DB write",async()=>{
  const response=await POST(new Request(url,{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({action:"PUBLISH",products:[{
      id:"product-a",updatedAt:"2026-10-28T10:00:00.000Z",
    }]}),
  }));
  assert.equal(response.status,401);
  assert.equal(response.headers.get("Cache-Control"),"no-store");
  assert.deepEqual((await response.json()).ok,false);
});
