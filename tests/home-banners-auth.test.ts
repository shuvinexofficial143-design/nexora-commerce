import assert from "node:assert/strict";
import test from "node:test";
import { GET, POST } from "../app/api/admin-app/banners/route";
import { PATCH } from "../app/api/admin-app/banners/[bannerId]/route";
const url="http://localhost:3137/api/admin-app/banners";
test("homepage CMS API denies anonymous read even without any configured database",async()=>{
  const response=await GET(new Request(url));
  assert.equal(response.status,401);
  assert.equal(response.headers.get("Cache-Control"),"no-store");
  const json=await response.json() as {ok:boolean;error:string};
  assert.equal(json.ok,false);
  assert.equal(JSON.stringify(json).includes("title"),false);
});
test("homepage CMS refuses anonymous create, including attempted publish",async()=>{
  const response=await POST(new Request(url,{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({title:"Unauthorized",published:true}),
  }));
  assert.equal(response.status,401);
});
test("homepage CMS refuses anonymous update and archive",async()=>{
  const response=await PATCH(new Request(url+"/any-banner",{
    method:"PATCH",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({published:true,archived:false}),
  }),{params:Promise.resolve({bannerId:"any-banner"})});
  assert.equal(response.status,401);
});
