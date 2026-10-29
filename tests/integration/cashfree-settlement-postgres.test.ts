import assert from "node:assert/strict";
import {createHmac,randomUUID} from "node:crypto";
import {before,after,test} from "node:test";
import {getPrisma} from "../../lib/db/prisma";
import {
  syncCashfreePayment,createCashfreePaymentSession,
} from "../../lib/payments/cashfree";
import {POST as cashfreeWebhook} from "../../app/api/payments/cashfree/webhook/route";

function assertDisposable(){
  if(process.env.NEXORA_QA_ALLOW_DB_INTEGRATION!=="true")
    throw Error("Cashfree settlement tests require isolated PostgreSQL opt-in.");
  for(const key of ["DATABASE_URL","DIRECT_URL"]){
    const u=new URL(process.env[key]||"");
    if(!["localhost","127.0.0.1","::1","[::1]"].includes(u.hostname)||
      u.username!=="nexora_qa"||u.pathname!=="/nexora_qa")
      throw Error("Refusing non-disposable PostgreSQL.");
  }
}
assertDisposable();
const db=getPrisma();
const tag=randomUUID().replaceAll("-","").slice(0,12);
const mockPayments=new Map<string,Array<Record<string,unknown>>>();
const oldFetch=globalThis.fetch;
const oldEnv={
  id:process.env.CASHFREE_CLIENT_ID,secret:process.env.CASHFREE_CLIENT_SECRET,
  env:process.env.CASHFREE_ENV,base:process.env.CASHFREE_API_BASE,
  resend:process.env.RESEND_API_KEY,from:process.env.ORDER_EMAIL_FROM,
};
const fakeSecret="qa-cashfree-secret-never-real-"+tag;
let counter=0;
const full=(amount=1299)=>({
  payment_status:"SUCCESS",payment_amount:amount,payment_currency:"INR",
  cf_payment_id:"cf-qa-"+tag,
});
async function fixture(status:"PENDING"|"CANCELLED"="PENDING"){
  counter+=1;
  const email="qa-cashfree-"+tag+"-"+counter+"@example.invalid";
  const user=await db.user.create({data:{
    email,name:"QA buyer",passwordHash:"QA only never login",
  }});
  const number="NX-CFQA-"+tag+"-"+counter;
  const order=await db.order.create({data:{
    orderNumber:number,userId:user.id,status,paymentMethod:"cashfree",
    paymentStatus:"PENDING",subtotalMinor:129900,totalMinor:129900,
    currency:"INR",shippingAddress:{
      fullName:"QA Buyer",line1:"Disposable test",city:"Indore",
      state:"MP",postalCode:"452001",phone:"9876543210",
    },
  }});
  return {order,email};
}
function paymentResults(number:string,results:Array<Record<string,unknown>>){
  mockPayments.set(number,results);
}
async function notificationCount(id:string,type:string){
  const rows=await db.$queryRawUnsafe<Array<{n:bigint}>>(
    'SELECT COUNT(*) n FROM "AdminNotification" WHERE "entityType"=$1 AND "entityId"=$2 AND "type"=$3',
    "ORDER",id,type);
  return Number(rows[0]?.n??0n);
}
async function signedWebhook(number:string){
  const body=JSON.stringify({type:"PAYMENT_SUCCESS_WEBHOOK",
    data:{order:{order_id:number},payment:{payment_status:"SUCCESS"}}});
  const timestamp=String(Date.now());
  const signature=createHmac("sha256",fakeSecret)
    .update(timestamp+body).digest("base64");
  return cashfreeWebhook(new Request("http://127.0.0.1:3137/api/payments/cashfree/webhook",{
    method:"POST",headers:{"x-webhook-timestamp":timestamp,"x-webhook-signature":signature},
    body,
  }));
}
before(async()=>{
  await db.$connect();
  process.env.CASHFREE_CLIENT_ID="qa-id-"+tag;
  process.env.CASHFREE_CLIENT_SECRET=fakeSecret;
  process.env.CASHFREE_ENV="sandbox";
  delete process.env.CASHFREE_API_BASE;
  delete process.env.RESEND_API_KEY;
  delete process.env.ORDER_EMAIL_FROM;
  // Every gateway request is intercepted. Impossible to reach production.
  globalThis.fetch=async(input:RequestInfo|URL)=>{
    const url=new URL(typeof input==="string"?input:input instanceof URL?input.href:input.url);
    assert.equal(url.origin,"https://sandbox.cashfree.com");
    const match=/^\/pg\/orders\/([^/]+)\/payments$/.exec(url.pathname);
    assert.ok(match,"Only mocked Cashfree payments GET is permitted");
    const number=decodeURIComponent(match[1]);
    return new Response(JSON.stringify(mockPayments.get(number)??[]),{
      status:200,headers:{"Content-Type":"application/json"},
    });
  };
  await db.$executeRawUnsafe(
    'CREATE TABLE IF NOT EXISTS "AdminNotification" ("id" TEXT PRIMARY KEY, "type" TEXT NOT NULL, "title" TEXT NOT NULL, "message" TEXT NOT NULL, "entityType" TEXT, "entityId" TEXT, "severity" TEXT NOT NULL DEFAULT \'INFO\', "readAt" TIMESTAMPTZ, "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now())'
  );
});
after(async()=>{
  globalThis.fetch=oldFetch;
  for(const [key,value] of Object.entries({
    CASHFREE_CLIENT_ID:oldEnv.id,CASHFREE_CLIENT_SECRET:oldEnv.secret,
    CASHFREE_ENV:oldEnv.env,CASHFREE_API_BASE:oldEnv.base,
    RESEND_API_KEY:oldEnv.resend,ORDER_EMAIL_FROM:oldEnv.from,
  })){
    if(value===undefined)delete process.env[key];
    else process.env[key]=value;
  }
  await db.$disconnect();
});

test("parallel payment status + signed webhooks mark PAID exactly once",async()=>{
  const {order}=await fixture();
  paymentResults(order.orderNumber,[full()]);
  const outcomes=await Promise.all([
    syncCashfreePayment(order.orderNumber),
    syncCashfreePayment(order.orderNumber),
    signedWebhook(order.orderNumber),
    signedWebhook(order.orderNumber),
  ]);
  for(const result of outcomes){
    if("state" in result)assert.equal(result.state,"SUCCESS");
    else assert.equal(result.status,200);
  }
  const stored=await db.order.findUniqueOrThrow({where:{id:order.id}});
  assert.equal(stored.paymentStatus,"PAID");
  assert.equal(stored.status,"CONFIRMED");
  assert.equal(await notificationCount(order.id,"PAYMENT_PAID"),1);
  const repeat=await syncCashfreePayment(order.orderNumber);
  assert.equal(repeat.paymentStatus,"PAID");
  assert.equal(await notificationCount(order.id,"PAYMENT_PAID"),1);
});
test("missing/mismatched gateway amounts, currency and ID cannot mark PAID",async()=>{
  for(const missing of [
    {payment_status:"SUCCESS",payment_currency:"INR",cf_payment_id:"p"},
    {payment_status:"SUCCESS",payment_amount:1299,cf_payment_id:"p"},
    {payment_status:"SUCCESS",payment_amount:1298, payment_currency:"INR",cf_payment_id:"p"},
    {payment_status:"SUCCESS",payment_amount:1299, payment_currency:"USD",cf_payment_id:"p"},
    {payment_status:"SUCCESS",payment_amount:1299,payment_currency:"INR"},
  ]){
    const {order}=await fixture();
    paymentResults(order.orderNumber,[missing]);
    await assert.rejects(syncCashfreePayment(order.orderNumber),/amount|currency|identifier/);
    assert.equal((await db.order.findUniqueOrThrow({where:{id:order.id}})).paymentStatus,"PENDING");
    assert.equal(await notificationCount(order.id,"PAYMENT_PAID"),0);
  }
});
test("late provider FAILURE does not downgrade already verified PAID state",async()=>{
  const {order}=await fixture();
  paymentResults(order.orderNumber,[full()]);
  await syncCashfreePayment(order.orderNumber);
  paymentResults(order.orderNumber,[{payment_status:"FAILED"}]);
  const retry=await syncCashfreePayment(order.orderNumber);
  assert.equal(retry.state,"SUCCESS");
  assert.equal(retry.paymentStatus,"PAID");
  assert.equal((await db.order.findUniqueOrThrow({where:{id:order.id}})).status,"CONFIRMED");
  assert.equal(await notificationCount(order.id,"PAYMENT_FAILED"),0);
});
test("FAILED state is reversible only after verified gateway SUCCESS, with one paid notification",async()=>{
  const {order}=await fixture();
  paymentResults(order.orderNumber,[{payment_status:"FAILED"}]);
  const failed=await syncCashfreePayment(order.orderNumber);
  assert.equal(failed.state,"FAILED");
  assert.equal(failed.paymentStatus,"FAILED");
  const again=await syncCashfreePayment(order.orderNumber);
  assert.equal(again.state,"FAILED");
  assert.equal(await notificationCount(order.id,"PAYMENT_FAILED"),1);
  paymentResults(order.orderNumber,[full()]);
  const paid=await syncCashfreePayment(order.orderNumber);
  assert.equal(paid.paymentStatus,"PAID");
  assert.equal(paid.orderStatus,"CONFIRMED");
  assert.equal(await notificationCount(order.id,"PAYMENT_PAID"),1);
});
test("cancelled order cannot start new payment; late verified success needs manual review",async()=>{
  const {order,email}=await fixture("CANCELLED");
  await assert.rejects(createCashfreePaymentSession(order.orderNumber,email),/closed/);
  paymentResults(order.orderNumber,[full()]);
  const settled=await syncCashfreePayment(order.orderNumber);
  assert.equal(settled.paymentStatus,"PAID");
  assert.equal(settled.orderStatus,"CANCELLED");
  assert.equal((await db.order.findUniqueOrThrow({where:{id:order.id}})).status,"CANCELLED");
  assert.equal(await notificationCount(order.id,"PAYMENT_PAID_REVIEW"),1);
  assert.equal(await notificationCount(order.id,"PAYMENT_PAID"),0);
});
test("provider PENDING never overrides existing local state or generates paid notifications",async()=>{
  const {order}=await fixture();
  paymentResults(order.orderNumber,[{payment_status:"PENDING"}]);
  const pending=await syncCashfreePayment(order.orderNumber);
  assert.equal(pending.state,"PENDING");
  assert.equal(pending.paymentStatus,"PENDING");
  assert.equal(await notificationCount(order.id,"PAYMENT_PAID"),0);
});
