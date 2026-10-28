import assert from "node:assert/strict";
import test from "node:test";
import { POST } from "../app/api/admin-app/banners/reorder/route";
test("anonymous users cannot reorder homepage banners",async()=>{
  const response=await POST(new Request("http://localhost:3137/api/admin-app/banners/reorder",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({items:[
      {id:"one",updatedAt:"2026-10-28T12:00:00.000Z"},
      {id:"two",updatedAt:"2026-10-28T12:00:00.000Z"},
    ]}),
  }));
  assert.equal(response.status,401);
  assert.equal(response.headers.get("Cache-Control"),"no-store");
});
