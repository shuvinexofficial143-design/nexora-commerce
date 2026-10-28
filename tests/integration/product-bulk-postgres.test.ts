import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {before,after,test} from "node:test";
import {getPrisma} from "../../lib/db/prisma";
import {applyBulkProductAction,BulkProductConflict} from "../../lib/admin/product-bulk";
import {createAttributeDefinition} from "../../lib/admin/product-attributes";
import {getProductBySlug} from "../../lib/db/products";

function disposable(){
  if(process.env.NEXORA_QA_ALLOW_DB_INTEGRATION!=="true")
    throw Error("Bulk write tests require disposable PostgreSQL opt-in.");
  for(const name of ["DATABASE_URL","DIRECT_URL"]){
    const u=new URL(process.env[name]||"");
    if(!["localhost","127.0.0.1","::1","[::1]"].includes(u.hostname)||
      u.username!=="nexora_qa"||u.pathname!=="/nexora_qa")
      throw Error("Refusing production or non-ephemeral database.");
  }
}
disposable();
const db=getPrisma(),tag=randomUUID().replaceAll("-","").slice(0,12);
const sku="BULK-"+tag;
let adminId="",catId="",catSlug="",brandId="";
const ids:Record<string,string>={};
const revisions=async(...keys:string[])=>{
  const rows=await db.product.findMany({where:{id:{in:keys.map(k=>ids[k])}},
    select:{id:true,updatedAt:true}});
  return rows.map(x=>({id:x.id,updatedAt:x.updatedAt.toISOString()}));
};
const status=async(key:string)=>(await db.product.findUniqueOrThrow({
  where:{id:ids[key]},select:{status:true,featured:true},
}));
before(async()=>{
  await db.$connect();
  // Raw audit table is intentionally not in Prisma schema.
  // Build only in disposable QA PostgreSQL; never migrate production.
  await db.$executeRawUnsafe(
    'CREATE TABLE IF NOT EXISTS "AdminActivityLog" ("id" TEXT PRIMARY KEY, "adminUserId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE RESTRICT, "action" TEXT NOT NULL, "entityType" TEXT NOT NULL, "entityId" TEXT, "summary" TEXT NOT NULL, "metadata" JSONB, "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now())'
  );
  const user=await db.user.create({data:{
    email:"qa-bulk-"+tag+"@example.invalid",name:"Bulk QA Owner",
    passwordHash:"qa-not-login",role:"ADMIN",
  }});
  adminId=user.id;
  const category=await db.category.create({data:{slug:"bulk-cat-"+tag,name:"Bulk Spec "+tag}});
  catId=category.id;catSlug=category.slug;
  const brand=await db.brand.create({data:{slug:"bulk-brand-"+tag,name:"Bulk Brand "+tag}});
  brandId=brand.id;
  await createAttributeDefinition({categoryId:catId,name:"RAM",type:"SELECT",
    required:true,options:["4 GB","8 GB"]});
  for(const [key,attributes] of [
    ["a",{ram:"4 GB"}],["b",{ram:"8 GB"}],["incomplete",{}],
  ] as const){
    const p=await db.product.create({data:{
      name:"Bulk Product "+tag+" "+key,sku:sku+"-"+key,slug:"bulk-"+tag+"-"+key,
      description:"Safe bulk product",priceMinor:75000,status:"DRAFT",
      categoryId:catId,brandId,attributes,
    }});
    ids[key]=p.id;
  }
  const archived=await db.product.create({data:{
    name:"Bulk Archived "+tag,sku:sku+"-archive",slug:"bulk-"+tag+"-archive",
    description:"Do not modify",priceMinor:5000,status:"ARCHIVED",
  }});
  ids.archived=archived.id;
});
after(async()=>await db.$disconnect());
const batch=async(action:"PUBLISH"|"MOVE_TO_DRAFT"|"FEATURE"|"UNFEATURE",...keys:string[])=>
  applyBulkProductAction({action,products:await revisions(...keys)},adminId);
async function auditRows(){
  return db.$queryRawUnsafe<Array<{action:string;entityId:string}>>(
    'SELECT "action","entityId" FROM "AdminActivityLog" WHERE "adminUserId"=$1 ORDER BY "createdAt" ASC',adminId);
}
test("required specs failure aborts all selected products and audit writes",async()=>{
  await assert.rejects(batch("PUBLISH","a","incomplete"),/RAM is required/);
  assert.equal((await status("a")).status,"DRAFT");
  assert.equal((await status("incomplete")).status,"DRAFT");
  assert.equal((await auditRows()).length,0);
  assert.equal(await getProductBySlug("bulk-"+tag+"-a"),null);
});
test("fix incomplete spec then all products publish atomically; public product appears",async()=>{
  await db.product.update({where:{id:ids.incomplete},data:{attributes:{ram:"8 GB"}}});
  const result=await batch("PUBLISH","a","b","incomplete");
  assert.deepEqual([result.requested,result.changed,result.unchanged],[3,3,0]);
  for(const key of ["a","b","incomplete"])assert.equal((await status(key)).status,"ACTIVE");
  assert.equal((await auditRows()).length,3);
  assert.ok(await getProductBySlug("bulk-"+tag+"-a"));
  const replay=await batch("PUBLISH","a","b");
  assert.deepEqual([replay.changed,replay.unchanged],[0,2]);
  assert.equal((await auditRows()).length,3);
});
test("hidden parent category/inactive brand blocks a draft publish (no other writes)",async()=>{
  const draft=await batch("MOVE_TO_DRAFT","b");
  assert.equal(draft.changed,1);
  const count=(await auditRows()).length;
  await db.category.update({where:{id:catId},data:{visible:false}});
  await assert.rejects(batch("PUBLISH","b"),/category is hidden/);
  assert.equal((await status("b")).status,"DRAFT");
  await db.category.update({where:{id:catId},data:{visible:true}});
  await db.brand.update({where:{id:brandId},data:{active:false}});
  await assert.rejects(batch("PUBLISH","b"),/brand is inactive/);
  assert.equal((await auditRows()).length,count);
  await db.brand.update({where:{id:brandId},data:{active:true}});
  assert.equal((await batch("PUBLISH","b")).changed,1);
});
test("revision mismatch for any selected product returns 409-style conflict without partial writes",async()=>{
  const before=await revisions("a","b");
  // Mimic concurrent owner saving a product after selection.
  await db.product.update({where:{id:ids.b},data:{name:"Changed by another owner "+tag,
    updatedAt:new Date(Date.now()+3000)}});
  const auditBefore=(await auditRows()).length;
  await assert.rejects(applyBulkProductAction({
    action:"MOVE_TO_DRAFT",products:before,
  },adminId),BulkProductConflict);
  assert.equal((await status("a")).status,"ACTIVE");
  assert.equal((await auditRows()).length,auditBefore);
});
test("archive cannot be toggled, feature only changes featured; draft removes live visibility",async()=>{
  await assert.rejects(batch("FEATURE","a","archived"),/Archived products/);
  assert.equal((await status("a")).featured,false);
  assert.equal((await batch("FEATURE","a","b")).changed,2);
  assert.equal((await status("a")).featured,true);
  assert.equal((await batch("UNFEATURE","a","b")).changed,2);
  const draft=await batch("MOVE_TO_DRAFT","a","b");
  assert.equal(draft.changed,2);
  assert.equal(await getProductBySlug("bulk-"+tag+"-a"),null);
  assert.equal((await db.product.findUniqueOrThrow({where:{id:ids.a}})).priceMinor,75000);
  assert.ok((await auditRows()).every(x=>x.action.startsWith("PRODUCT_BULK_")));
});
