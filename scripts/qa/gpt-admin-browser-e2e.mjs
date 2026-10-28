#!/usr/bin/env node
// Authenticated Admin E2E. ALL calls are localhost, all writes target a
// disposable PostgreSQL container, Cashfree disabled, no emails or uploads.
import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {mkdirSync,writeFileSync} from "node:fs";
import {join} from "node:path";
import {pathToFileURL} from "node:url";
import pg from "pg";

const base=new URL(process.env.NEXORA_QA_BASE_URL||"");
const urls=[process.env.DATABASE_URL,process.env.DIRECT_URL].map(s=>new URL(s||""));
const local=x=>["localhost","127.0.0.1","::1","[::1]"].includes(x.hostname);
const okay=base.protocol==="http:"&&base.hostname==="127.0.0.1"&&
  base.port==="3137"&&base.pathname==="/"&&!base.search&&!base.hash&&
  !base.username&&!base.password&&urls.every(u=>local(u)&&u.protocol==="postgresql:"&&
    u.username==="nexora_qa"&&u.pathname==="/nexora_qa")&&
  process.env.NEXORA_QA_ALLOW_DB_INTEGRATION==="true"&&
  process.env.NEXT_PUBLIC_CASHFREE_ENABLED==="false"&&
  process.env.NEXORA_QA_DEMO_CATALOG!=="true"&&
  process.env.ADMIN_OWNER_EMAIL?.endsWith("@example.invalid")&&
  process.env.ADMIN_USERNAME&&process.env.ADMIN_PASSWORD&&
  process.env.NEXORA_QA_PLAYWRIGHT_DIR;
if(!okay)throw Error("REFUSED: authenticated browser QA requires disposable localhost PostgreSQL and mock owner.");
const evidence=process.env.NEXORA_QA_EVIDENCE_DIR||"/tmp/nexora-owner-e2e";
mkdirSync(evidence,{recursive:true});
const client=new pg.Client({connectionString:process.env.DATABASE_URL});
await client.connect();
try{
  // Prisma deliberately does not own AdminActivityLog. Create a QA-only
  // identical table; never apply this SQL outside disposable DB.
  await client.query('CREATE TABLE IF NOT EXISTS "AdminActivityLog" ('+
    '"id" TEXT PRIMARY KEY,"adminUserId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE RESTRICT,'+
    '"action" TEXT NOT NULL,"entityType" TEXT NOT NULL,"entityId" TEXT,'+
    '"summary" TEXT NOT NULL,"metadata" JSONB,"createdAt" TIMESTAMPTZ NOT NULL DEFAULT now())');
}finally{await client.end();}
const {chromium}=await import(pathToFileURL(join(
  process.env.NEXORA_QA_PLAYWRIGHT_DIR,"node_modules/playwright/index.mjs")).href);
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({
  viewport:{width:1366,height:900},serviceWorkers:"block",
});
const page=await context.newPage();
page.setDefaultTimeout(25000);
const tag=randomUUID().replaceAll("-","").slice(0,10);
const category="e2e-cat-"+tag,brand="e2e-brand-"+tag;
const sku="E2E-"+tag.toUpperCase(),title="Owner E2E Watch "+tag;
const image="https://images.unsplash.com/photo-111111";
const results=[];
const endpoint=(path)=>new URL(path,base).href;
async function verify(label,run){
  try{
    await run();
    results.push({label,status:"PASS"});
    console.log("PASS OWNER E2E",label);
  }catch(error){
    results.push({label,status:"FAIL",error:String(error)});
    try{await page.screenshot({path:join(evidence,label.replace(/[^a-z0-9]+/gi,"-")+".png"),fullPage:true});}
    catch{/* diagnostic only */}
    throw error;
  }
}
async function api(path,method="GET",data){
  const response=await context.request.fetch(endpoint(path),{
    method,...(data===undefined?{}:{data}),
    failOnStatusCode:false,
  });
  const payload=await response.json().catch(()=>null);
  assert.equal(response.ok()&&payload?.ok,true,
    path+" status="+response.status()+" body="+JSON.stringify(payload));
  return payload.data;
}
async function product(){
  const rows=await api("/api/admin-app/products");
  const found=rows.find(row=>row.sku===sku);
  assert.ok(found,"Owner product not found after save");
  return found;
}
async function ready(){
  for(let n=0;n<50;n++){
    try{
      const response=await fetch(endpoint("/"),{signal:AbortSignal.timeout(2500)});
      if(response.status===200)return;
    }catch{/* dev server warming */}
    await new Promise(r=>setTimeout(r,1000));
  }
  throw Error("Local owner QA Next.js server failed to start");
}
await ready();
try{
  await verify("unauthenticated-admin-denied",async()=>{
    const response=await context.request.get(endpoint("/api/admin-app/products"));
    assert.equal(response.status(),401);
    const body=await response.json();
    assert.equal(body.ok,false);
  });
  await verify("real-owner-login-browser-and-cookie",async()=>{
    await page.goto(endpoint("/admin/login"),{waitUntil:"domcontentloaded"});
    await page.getByPlaceholder("Owner username").fill(process.env.ADMIN_USERNAME);
    await page.locator('input[type="password"]').fill(process.env.ADMIN_PASSWORD);
    await page.getByRole("button",{name:"Open admin panel"}).click();
    await page.waitForURL(url=>url.pathname==="/admin",{timeout:30000});
    const owner=await api("/api/admin-app/auth/me");
    assert.equal(owner.user.role,"ADMIN");
    await page.goto(endpoint("/admin/products"),{waitUntil:"domcontentloaded"});
    await page.getByRole("heading",{name:"Products",exact:true}).waitFor();
  });
  await verify("owner-category-brand-and-required-attribute",async()=>{
    const cat=await api("/api/admin-app/product-taxonomy","POST",{
      kind:"category",name:"E2E Watches "+tag,slug:category,
    });
    await api("/api/admin-app/product-taxonomy","POST",{
      kind:"brand",name:"E2E Maker "+tag,slug:brand,
    });
    await api("/api/admin-app/catalog/attributes","POST",{
      categoryId:cat.id,name:"Case Material",type:"SELECT",options:["Steel","Titanium"],
      required:true,
    });
    await page.reload({waitUntil:"domcontentloaded"});
    await page.getByRole("heading",{name:"Products",exact:true}).waitFor();
    await page.getByRole("heading",{name:"Add product"}).waitFor();
  });
  await verify("draft-product-create-through-real-browser",async()=>{
    const panel=page.locator("section").filter({
      has:page.getByRole("heading",{name:"Add product"}),
    }).first();
    const form=panel.locator("form").first();
    await form.getByPlaceholder("Gift product").fill(title);
    await form.getByPlaceholder("NX-GIFT-001").fill(sku);
    await form.getByPlaceholder("999").fill("1299");
    await form.getByPlaceholder("Leave empty for no compare-at price").fill("1599");
    await form.getByRole("combobox",{name:/Category/}).first().selectOption(category);
    await form.getByRole("combobox",{name:/Brand/}).first().selectOption(brand);
    await form.getByRole("combobox",{name:/Case Material/}).selectOption("Steel");
    const call=page.waitForResponse(res=>new URL(res.url()).pathname==="/api/admin-app/products/manage"&&
      res.request().method()==="POST");
    await form.getByRole("button",{name:"Create draft product"}).click();
    const saved=await call;
    assert.equal(saved.status(),201,await saved.text());
    const row=await product();
    assert.equal(row.status,"DRAFT");
    assert.equal(row.compareAtMinor,159900);
    assert.deepEqual(row.attributes,{"case-material":"Steel"});
    assert.equal((await context.request.get(endpoint("/api/backend/products/"+row.slug))).status(),404);
  });
  await verify("editor-preview-and-gallery-persist-through-browser",async()=>{
    await page.reload({waitUntil:"domcontentloaded"});
    const details=page.locator("details").filter({hasText:sku}).first();
    await details.locator("summary").click();
    await details.getByText("Unsaved product preview").first().waitFor();
    const form=details.locator("form");
    await form.getByRole("spinbutton",{name:"Original price in rupees"}).fill("1699");
    await form.getByRole("spinbutton",{name:"Product price"}).fill("1399");
    await form.getByPlaceholder("Poster image URL").fill(image);
    const call=page.waitForResponse(res=>new URL(res.url()).pathname.includes(
      "/api/admin-app/products/")&&res.request().method()==="PATCH");
    await form.getByRole("button",{name:"Save changes"}).click();
    const saved=await call;
    assert.equal(saved.status(),200,await saved.text());
    const row=await product();
    assert.equal(row.priceMinor,139900);
    assert.equal(row.compareAtMinor,169900);
    assert.equal(row.posterUrl,image);
  });
  await verify("owner-publish-and-public-visibility",async()=>{
    const row=await product();
    await api("/api/admin-app/products/"+row.id,"PATCH",{status:"ACTIVE"});
    const publicPage=await context.request.get(endpoint("/api/backend/products/"+row.slug));
    assert.equal(publicPage.status(),200);
    const body=await publicPage.json();
    assert.equal(body.data.sku,sku);
    assert.equal(body.data.attributes["case-material"],"Steel");
  });
  await verify("visibility-control-blocks-public-read",async()=>{
    await api("/api/admin-app/product-taxonomy","PATCH",{
      kind:"category",slug:category,visible:false,
    });
    const row=await product();
    assert.equal((await context.request.get(endpoint("/api/backend/products/"+row.slug))).status(),404);
    await api("/api/admin-app/product-taxonomy","PATCH",{
      kind:"category",slug:category,visible:true,
    });
    assert.equal((await context.request.get(endpoint("/api/backend/products/"+row.slug))).status(),200);
  });
  await verify("bulk-draft-revokes-published-product",async()=>{
    const row=await product();
    const result=await api("/api/admin-app/products/bulk","POST",{
      action:"MOVE_TO_DRAFT",
      products:[{id:row.id,updatedAt:row.updatedAt}],
    });
    assert.equal(result.changed,1);
    assert.equal((await context.request.get(endpoint("/api/backend/products/"+row.slug))).status(),404);
    const stale=await context.request.post(endpoint("/api/admin-app/products/bulk"),{
      data:{action:"PUBLISH",products:[{id:row.id,updatedAt:row.updatedAt}]},
    });
    assert.equal(stale.status(),409);
  });
  await verify("banner-admin-preview-and-mobile-layout",async()=>{
    const created=await api("/api/admin-app/banners","POST",{
      title:"Owner test banner "+tag,imageUrl:image,description:"Local QA banner",
      ctaText:"Shop now",ctaHref:"/shop",published:false,sortOrder:0,
    });
    assert.equal(created.published,false);
    await page.goto(endpoint("/admin/banners"),{waitUntil:"domcontentloaded"});
    const preview=page.getByRole("region",{name:"Unsaved homepage banner preview"}).first();
    await preview.getByRole("heading",{name:"Live homepage preview"}).waitFor();
    await page.setViewportSize({width:390,height:844});
    await preview.getByRole("button",{name:"Mobile"}).click();
    assert.equal(await preview.getByRole("button",{name:"Mobile"}).getAttribute("aria-pressed"),"true");
  });
  // Keep evidence and audits within disposable PostgreSQL. No checkout orders,
  // payments, external email, production URLs or external image upload calls.
}finally{
  await context.close();
  await browser.close();
  writeFileSync(join(evidence,"admin-e2e-results.json"),
    JSON.stringify({localOnly:true,db:"nexora_qa",results},null,2)+"\n");
}
console.log("ADMIN E2E RESULTS",results.filter(x=>x.status==="PASS").length,
  "PASS /",results.filter(x=>x.status==="FAIL").length,"FAIL");
