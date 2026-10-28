import assert from "node:assert/strict";
import test from "node:test";
import {GET,POST,PATCH} from "../app/api/admin-app/catalog/attributes/route";
const url="http://localhost:3137/api/admin-app/catalog/attributes";
test("Attribute definitions are not accessible without Owner session",async()=>{
  assert.equal((await GET(new Request(url))).status,401);
});
test("Cannot create or deactivate product specification without Owner session",async()=>{
  const created=await POST(new Request(url,{method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({categoryId:"cat",name:"RAM",type:"TEXT"}),
  }));
  assert.equal(created.status,401);
  const disabled=await PATCH(new Request(url,{method:"PATCH",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({id:"attr",active:false}),
  }));
  assert.equal(disabled.status,401);
});
