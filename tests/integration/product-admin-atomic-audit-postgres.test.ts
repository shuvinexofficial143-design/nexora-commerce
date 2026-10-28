import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { before,after,test } from "node:test";
import { getPrisma } from "../../lib/db/prisma";
import { createProduct,updateProduct } from "../../lib/admin/product-admin";

function ensureIsolatedDatabase(){
  if(process.env.NEXORA_QA_ALLOW_DB_INTEGRATION!=="true")
    throw new Error("Atomic audit testing requires explicit disposable PostgreSQL opt-in.");
  for(const key of ["DATABASE_URL","DIRECT_URL"]){
    const url=new URL(process.env[key]||"");
    if(!["localhost","127.0.0.1","::1","[::1]"].includes(url.hostname)||
      url.pathname!=="/nexora_qa"||url.username!=="nexora_qa")
      throw new Error("Refusing to test audit faults on non-disposable database.");
  }
}
ensureIsolatedDatabase();
const db=getPrisma();
const tag=randomUUID().replaceAll("-","").slice(0,12);
let adminId="",productId="";
const firstPoster="https://images.unsplash.com/photo-111";
const nextPoster="https://images.unsplash.com/photo-222";
const gallery="https://images.unsplash.com/photo-333";
const video="https://youtu.be/abcdefghijk";
const productSku="AUDIT-"+tag;
const failedSku="AUDIT-FAIL-"+tag;
const triggerName="qa_reject_gpt_product_audit_trg";
const functionName="qa_reject_gpt_product_audit_fn";
async function createAuditTable(){
  await db.$executeRawUnsafe(
    'CREATE TABLE IF NOT EXISTS "AdminActivityLog" ("id" TEXT PRIMARY KEY, "adminUserId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE RESTRICT, "action" TEXT NOT NULL, "entityType" TEXT NOT NULL, "entityId" TEXT, "summary" TEXT NOT NULL, "metadata" JSONB, "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now())'
  );
}
async function stopAuditFault(){
  await db.$executeRawUnsafe('DROP TRIGGER IF EXISTS '+triggerName+' ON "AdminActivityLog"');
  await db.$executeRawUnsafe('DROP FUNCTION IF EXISTS '+functionName+'()');
}
async function startAuditFault(action:string){
  await stopAuditFault();
  // Values are fixed known actions; the owner id is a generated alphanumeric
  // Prisma ID. Never interpolate external text into DDL.
  assert.ok(["PRODUCT_CREATE","PRODUCT_UPDATE"].includes(action));
  assert.match(adminId,/^[A-Za-z0-9_-]+$/);
  await db.$executeRawUnsafe(
    'CREATE FUNCTION '+functionName+'() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN '+
    'IF NEW."adminUserId" = '+ "'" +adminId+ "'"+
    ' AND NEW."action" = '+ "'"+action+"'"+
    " THEN RAISE EXCEPTION 'QA deliberately rejected atomic audit'; END IF; "+
    'RETURN NEW; END; $$'
  );
  await db.$executeRawUnsafe(
    'CREATE TRIGGER '+triggerName+' BEFORE INSERT ON "AdminActivityLog" FOR EACH ROW EXECUTE FUNCTION '+functionName+'()'
  );
}
async function productAudit(action:string){
  return db.$queryRawUnsafe<Array<{action:string;entityId:string}>>(
    'SELECT "action","entityId" FROM "AdminActivityLog" WHERE "adminUserId" = $1 AND "action" = $2 ORDER BY "createdAt"',adminId,action);
}
before(async()=>{
  await db.$connect();
  await createAuditTable();
  const owner=await db.user.create({data:{
    email:"qa-atomic-audit-"+tag+"@example.invalid",
    name:"Atomic Audit QA",passwordHash:"test-only-no-login",role:"ADMIN",
  }});
  adminId=owner.id;
});
after(async()=>{
  await stopAuditFault().catch(()=>undefined);
  await db.$disconnect();
});

test("verified owner creates product, gallery and exactly one audit in a single commit",async()=>{
  const product=await createProduct({
    name:"Audit safety "+tag,sku:productSku,price:899,status:"DRAFT",
    posterUrl:firstPoster,videoUrl:video,images:[gallery],
  },adminId);
  productId=product.id;
  assert.deepEqual((await db.productImage.findMany({where:{productId},
    orderBy:{sortOrder:"asc"}})).map(x=>[x.sortOrder,x.url]),
    [[0,firstPoster],[1,video],[10,gallery]]);
  assert.deepEqual((await productAudit("PRODUCT_CREATE")).map(x=>x.entityId),[productId]);
});
test("blocked audit insert rolls back product creation and all associated media",async()=>{
  await startAuditFault("PRODUCT_CREATE");
  try {
    await assert.rejects(createProduct({
      name:"Rejected audit "+tag,sku:failedSku,price:999,status:"DRAFT",
      posterUrl:firstPoster,images:[gallery],
    },adminId),/QA deliberately rejected atomic audit/);
  } finally {await stopAuditFault();}
  assert.equal(await db.product.count({where:{sku:failedSku}}),0);
  assert.equal((await productAudit("PRODUCT_CREATE")).length,1);
  const mediaRows=await db.productImage.findMany({where:{product:{sku:failedSku}}});
  assert.equal(mediaRows.length,0);
});
test("blocked update audit rolls back price, description, status, gallery and revision",async()=>{
  const beforeProduct=await db.product.findUniqueOrThrow({where:{id:productId}});
  const beforeImages=await db.productImage.findMany({where:{productId},
    orderBy:{sortOrder:"asc"}});
  await startAuditFault("PRODUCT_UPDATE");
  try {
    await assert.rejects(updateProduct(productId,{
      name:"Should not persist",price:1399,description:"Must roll back",
      status:"ACTIVE",posterUrl:nextPoster,images:[nextPoster,gallery],
    },adminId),/QA deliberately rejected atomic audit/);
  } finally {await stopAuditFault();}
  const afterProduct=await db.product.findUniqueOrThrow({where:{id:productId}});
  const afterImages=await db.productImage.findMany({where:{productId},
    orderBy:{sortOrder:"asc"}});
  assert.equal(afterProduct.priceMinor,beforeProduct.priceMinor);
  assert.equal(afterProduct.status,beforeProduct.status);
  assert.equal(afterProduct.name,beforeProduct.name);
  assert.equal(afterProduct.description,beforeProduct.description);
  assert.equal(afterProduct.updatedAt.toISOString(),beforeProduct.updatedAt.toISOString());
  assert.deepEqual(afterImages.map(x=>[x.sortOrder,x.url]),
    beforeImages.map(x=>[x.sortOrder,x.url]));
  assert.equal((await productAudit("PRODUCT_UPDATE")).length,0);
});
test("normal edit records exactly one auditable success and does not double-write",async()=>{
  const saved=await updateProduct(productId,{
    price:1099,description:"Owner-approved catalog update",posterUrl:nextPoster,
  },adminId);
  assert.equal(saved.priceMinor,109900);
  assert.deepEqual((await productAudit("PRODUCT_UPDATE")).map(x=>x.entityId),[productId]);
  const images=await db.productImage.findMany({where:{productId},orderBy:{sortOrder:"asc"}});
  assert.deepEqual(images.map(x=>[x.sortOrder,x.url]),
    [[0,nextPoster],[1,video],[10,gallery]]);
});
test("forged or empty owner identity is rejected before creating any record",async()=>{
  for(const invalid of ["","x".repeat(129)]){
    await assert.rejects(createProduct({name:"Forged "+tag,sku:"BAD-"+tag,price:100},invalid),
      /Invalid admin identity/);
    await assert.rejects(updateProduct(productId,{price:100},invalid),
      /Invalid admin identity/);
  }
  assert.equal((await productAudit("PRODUCT_UPDATE")).length,1);
});
