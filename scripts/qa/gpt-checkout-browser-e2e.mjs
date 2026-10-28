#!/usr/bin/env node
// Disposable local checkout E2E: real HTTP guest order + real browser COD.
// Never talks to Cashfree, Resend, Vercel or any external endpoint.
import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {mkdirSync,writeFileSync} from "node:fs";
import {join} from "node:path";
import {pathToFileURL} from "node:url";
import pg from "pg";

const base=new URL(process.env.NEXORA_QA_BASE_URL||"");
const dbUris=["DATABASE_URL","DIRECT_URL"].map(k=>new URL(process.env[k]||""));
const local=u=>["localhost","127.0.0.1","::1","[::1]"].includes(u.hostname);
if(base.protocol!=="http:"||base.hostname!=="127.0.0.1"||base.port!=="3137"||
  base.pathname!=="/"||base.search||base.hash||base.username||base.password||
  dbUris.some(u=>!local(u)||u.protocol!=="postgresql:"||u.username!=="nexora_qa"||
    u.pathname!=="/nexora_qa")||
  process.env.NEXORA_QA_ALLOW_DB_INTEGRATION!=="true"||
  process.env.NEXORA_QA_PLAYWRIGHT_DIR===undefined||
  process.env.NEXORA_QA_DEMO_CATALOG==="true"||
  process.env.NEXT_PUBLIC_CASHFREE_ENABLED!=="false"||
  process.env.CASHFREE_CLIENT_ID||process.env.CASHFREE_CLIENT_SECRET||
  process.env.RESEND_API_KEY)
  throw Error("REFUSED: Checkout E2E must use isolated localhost Postgres, zero gateway and email credentials.");
const evidence=process.env.NEXORA_QA_EVIDENCE_DIR||"/tmp/nexora-checkout-e2e";
mkdirSync(evidence,{recursive:true});
const db=new pg.Client({connectionString:process.env.DATABASE_URL});
const tag=randomUUID().replaceAll("-","").slice(0,12);
const results=[];
const url=path=>new URL(path,base).href;
const postal={fullName:"Disposable QA Buyer",phone:"9876543210",line1:"QA-only delivery road",
  city:"Indore",state:"Madhya Pradesh",postalCode:"452001",country:"India"};
async function fixture(label,onHand,priceMinor){
  const productId=randomUUID(),warehouseId=randomUUID(),inventoryId=randomUUID();
  const sku="CHECKOUT-"+tag+"-"+label,slug="qa-checkout-"+tag+"-"+label;
  await db.query('INSERT INTO "Product" ("id","slug","sku","name","description","priceMinor","status","updatedAt") VALUES ($1,$2,$3,$4,$5,$6,\'ACTIVE\',NOW())',
    [productId,slug,sku,"Checkout QA "+label+" "+tag,"Ephemeral integration test",priceMinor]);
  await db.query('INSERT INTO "Warehouse" ("id","code","name","city","state","updatedAt") VALUES ($1,$2,$3,$4,$5,NOW())',
    [warehouseId,"QA-"+tag+"-"+label,"Isolated Checkout Warehouse","Indore","MP"]);
  await db.query('INSERT INTO "InventoryItem" ("id","productId","warehouseId","onHand","reserved","updatedAt") VALUES ($1,$2,$3,$4,$5,NOW())',
    [inventoryId,productId,warehouseId,onHand,0]);
  return {id:productId,slug,sku,inventoryId,priceMinor};
}
async function reservation(id){
  const x=await db.query('SELECT "reserved","onHand" FROM "InventoryItem" WHERE "id"=$1',[id]);
  return x.rows[0];
}
async function orderCount(productId){
  const x=await db.query('SELECT COUNT(DISTINCT o."id")::int AS count FROM "Order" o JOIN "OrderItem" oi ON oi."orderId"=o."id" WHERE oi."productId"=$1',[productId]);
  return x.rows[0].count;
}
async function check(name,fn){
  try{
    await fn();
    results.push({name,status:"PASS"});
    console.log("PASS CHECKOUT E2E",name);
  }catch(error){
    results.push({name,status:"FAIL",error:String(error)});
    console.error("FAIL CHECKOUT E2E",name,String(error));
    throw error;
  }
}
async function api(path,body,options={}){
  const response=await fetch(url(path),{
    method:body===undefined?"GET":"POST",
    headers:body===undefined?undefined:{"Content-Type":"application/json",...options.headers},
    ...(body===undefined?{}:{body:JSON.stringify(body)}),
    redirect:"manual",signal:AbortSignal.timeout(20000),
  });
  const json=await response.json().catch(()=>null);
  return {status:response.status,json,headers:response.headers};
}
let browser;
await db.connect();
try{
  const a=await fixture("api",3,80000);
  const b=await fixture("browser",1,129900);
  const email="qa-checkout-"+tag+"@example.invalid";
  const items=[{productId:a.id,quantity:1,expectedUnitPriceMinor:a.priceMinor}];
  const orderInput={items,shippingAddress:postal,contactEmail:email,
    deliveryMethod:"standard",paymentMethod:"cod"};
  const idempotencyKey="qa-checkout-key-"+randomUUID();

  await check("online-gateway-hard-disabled-and-no-external-charge",async()=>{
    const create=await api("/api/payments/cashfree/create",{orderNumber:"NX-20000101-DEADBEEF",email});
    assert.equal(create.status,503);
    const status=await api("/api/payments/cashfree/status?order=NX-20000101-DEADBEEF");
    assert.equal(status.status,503);
    const webhook=await api("/api/payments/cashfree/webhook",{type:"PAYMENT_SUCCESS"});
    assert.equal(webhook.status,503);
    assert.equal(await orderCount(a.id),0);
  });
  await check("server-authoritative-preview-readonly-and-no-reservation",async()=>{
    const p=await api("/api/backend/checkout/preview",{items:[{
      slug:a.slug,quantity:1,clientPriceMinor:80000}],deliveryMethod:"standard"});
    assert.equal(p.status,200);
    assert.equal(p.json?.data?.valid,true);
    assert.equal(p.json?.data?.changedPrice,false);
    assert.equal(p.json?.data?.lines?.[0]?.productId,a.id);
    assert.equal(p.json?.data?.lines?.[0]?.unitPriceMinor,80000);
    assert.equal(p.headers.get("Cache-Control"),"private, no-store");
    assert.equal((await reservation(a.inventoryId)).reserved,0);
    assert.equal(await orderCount(a.id),0);
  });
  await check("missing-idempotency-key-rejected-before-guest-or-order-write",async()=>{
    const x=await api("/api/backend/orders",orderInput);
    assert.equal(x.status,400);
    assert.equal(await orderCount(a.id),0);
    const user=await db.query('SELECT "id" FROM "User" WHERE "email"=$1',[email]);
    assert.equal(user.rows.length,0);
  });
  let created;
  await check("real-guest-COD-HTTP-order-reserves-exactly-one-unit",async()=>{
    const x=await api("/api/backend/orders",orderInput,{headers:{"Idempotency-Key":idempotencyKey}});
    assert.equal(x.status,201,JSON.stringify(x.json));
    created=x.json.data;
    assert.match(created.orderNumber,/^NX-[0-9]{8}-[A-F0-9]{8}$/);
    assert.equal(created.paymentMethod,"cod");
    assert.equal(created.totalMinor,104300);
    assert.equal((await reservation(a.inventoryId)).reserved,1);
    assert.equal(await orderCount(a.id),1);
  });
  await check("exact-retry-returns-original-order-without-extra-reserve",async()=>{
    const x=await api("/api/backend/orders",orderInput,{headers:{"Idempotency-Key":idempotencyKey}});
    assert.equal(x.status,200);
    assert.equal(x.json?.data?.id,created.id);
    assert.equal((await reservation(a.inventoryId)).reserved,1);
    assert.equal(await orderCount(a.id),1);
  });
  await check("forged-reused-key-different-purchase-rejected-without-write",async()=>{
    const changed={...orderInput,items:[{productId:a.id,quantity:2,expectedUnitPriceMinor:80000}]};
    const x=await api("/api/backend/orders",changed,{headers:{"Idempotency-Key":idempotencyKey}});
    assert.equal(x.status,409);
    assert.equal((await reservation(a.inventoryId)).reserved,1);
    assert.equal(await orderCount(a.id),1);
  });
  await check("email-scoped-recovery-returns-minimum-information-only",async()=>{
    const x=await api("/api/backend/orders/recover",{key:idempotencyKey,email:email.toUpperCase()});
    assert.equal(x.status,200);
    assert.equal(x.json?.data?.orderNumber,created.orderNumber);
    assert.deepEqual(Object.keys(x.json.data).sort(),
      ["orderNumber","paymentMethod","paymentStatus","status"].sort());
    assert.equal(JSON.stringify(x.json).includes(postal.line1),false);
    const other=await api("/api/backend/orders/recover",{
      key:idempotencyKey,email:"unrelated-"+tag+"@example.invalid",
    });
    assert.equal(other.status,404);
  });
  await check("oversell-blocked-after-previous-reservation",async()=>{
    const bad=await api("/api/backend/checkout/preview",{
      items:[{slug:a.slug,quantity:3,clientPriceMinor:80000}]});
    assert.equal(bad.status,200);
    assert.equal(bad.json?.data?.valid,false);
    const x=await api("/api/backend/orders",{
      ...orderInput,items:[{productId:a.id,quantity:3,expectedUnitPriceMinor:80000}],
    },{headers:{"Idempotency-Key":"qa-new-key-"+randomUUID()}});
    assert.equal(x.status,400,JSON.stringify(x.json));
    assert.equal((await reservation(a.inventoryId)).reserved,1);
    assert.equal(await orderCount(a.id),1);
  });
  await check("real-Chromium-COD-checkout-form-success-and-one-reservation",async()=>{
    const {chromium}=await import(pathToFileURL(join(process.env.NEXORA_QA_PLAYWRIGHT_DIR,
      "node_modules/playwright/index.mjs")).href);
    browser=await chromium.launch({headless:true});
    const context=await browser.newContext({viewport:{width:1366,height:900},
      serviceWorkers:"block"});
    const page=await context.newPage();
    page.setDefaultTimeout(30000);
    try{
      await page.goto(url("/"),{waitUntil:"domcontentloaded"});
      await page.evaluate(line=>{
        localStorage.setItem("nexora-commerce-state-v1",
          JSON.stringify({lines:[line],saved:[],wishlist:[],coupon:""}));
      },{
        id:b.id,slug:b.slug,name:"Checkout QA browser "+tag,brand:"QA",
        image:"/product-placeholder.svg",price:1299,stock:"low-stock",
        lineId:b.id+"::default::default",quantity:1,
      });
      await page.goto(url("/checkout"),{waitUntil:"domcontentloaded"});
      await page.getByText("Live price & stock verification").waitFor();
      await page.getByText(/Current product prices and available quantities checked/).waitFor();
      await page.getByPlaceholder("you@example.com").fill("qa-browser-"+tag+"@example.invalid");
      const address=page.getByRole("heading",{name:"Where should we deliver?"})
        .locator("xpath=ancestor::section[1]");
      for(const [label,value] of [
        ["Full name","QA Browser Buyer"],["Phone","9876543210"],["House / street","QA Browser Address"],
        ["City","Indore"],["State","Madhya Pradesh"],["PIN code","452001"],
      ])await address.getByText(label,{exact:true}).locator("input").fill(value);
      await address.getByRole("button",{name:"Save & use address"}).click();
      const call=page.waitForResponse(resp=>
        new URL(resp.url()).pathname==="/api/backend/orders"&&resp.request().method()==="POST");
      await page.getByRole("button",{name:/Place COD order/}).click();
      const placed=await call;
      assert.equal(placed.status(),201,await placed.text());
      await page.waitForURL(u=>u.pathname==="/checkout/success",{timeout:30000});
      assert.equal((await reservation(b.inventoryId)).reserved,1);
      assert.equal(await orderCount(b.id),1);
      const cart=await page.evaluate(()=>JSON.parse(
        localStorage.getItem("nexora-commerce-state-v1")||"{}"));
      assert.equal(cart.lines?.length,0);
      await page.screenshot({path:join(evidence,"real-cod-checkout-success.png"),fullPage:true});
    }catch(error){
      await page.screenshot({path:join(evidence,"real-cod-checkout-failed.png"),fullPage:true})
        .catch(()=>{});
      throw error;
    }finally{await context.close();}
  });
}finally{
  if(browser)await browser.close();
  await db.end();
  writeFileSync(join(evidence,"checkout-e2e-results.json"),
    JSON.stringify({localhostOnly:true,paymentsDisabled:true,results},null,2)+"\n");
}
console.log("CHECKOUT E2E RESULTS",results.filter(x=>x.status==="PASS").length,
  "PASS /",results.filter(x=>x.status==="FAIL").length,"FAIL");
