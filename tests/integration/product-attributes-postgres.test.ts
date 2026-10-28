import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {before,after,test} from "node:test";
import {getPrisma} from "../../lib/db/prisma";
import {createAttributeDefinition,setAttributeState,listAttributeDefinitions}
  from "../../lib/admin/product-attributes";
import {createProduct,updateProduct} from "../../lib/admin/product-admin";
import {listProducts,getProductBySlug} from "../../lib/db/products";
import {mapBackendProductToCatalog} from "../../lib/catalog-backend";
import {buildProductDetail} from "../../lib/product-detail-data";

function guard(){
  if(process.env.NEXORA_QA_ALLOW_DB_INTEGRATION!=="true")
    throw Error("Disposable PostgreSQL required");
  for(const key of ["DATABASE_URL","DIRECT_URL"]){
    const u=new URL(process.env[key]||"");
    if(!["127.0.0.1","localhost","::1","[::1]"].includes(u.hostname)||
      u.username!=="nexora_qa"||u.pathname!=="/nexora_qa")
      throw Error("Refusing non-disposable database");
  }
}
guard();
const db=getPrisma(),id=randomUUID().replaceAll("-","").slice(0,11);
let categoryId="",categorySlug="",productId="",productSlug="",attrId="",secondId="";
before(async()=>{
  await db.$connect();
  const c=await db.category.create({data:{name:"Wearables "+id,slug:"spec-"+id}});
  const d=await db.category.create({data:{name:"Clothing "+id,slug:"spec-"+id+"-clothing"}});
  categoryId=c.id; categorySlug=c.slug;secondId=d.id;
});
after(async()=>await db.$disconnect());
test("owner definition persists to real PostgreSQL, duplicate slug conflicts",async()=>{
  const def=await createAttributeDefinition({categoryId,name:"RAM",type:"SELECT",
    options:["4 GB","8 GB"],required:true});
  attrId=def.id;
  assert.equal(def.slug,"ram");
  assert.equal(def.required,true);
  assert.ok((await listAttributeDefinitions(categoryId)).some(x=>x.id===def.id));
  await assert.rejects(createAttributeDefinition({categoryId,name:"RAM",type:"SELECT",
    options:["4 GB"]}),/already exists/);
});
test("Draft allows missing required category attribute; publishing without value is rejected atomically",async()=>{
  const p=await createProduct({name:"QA Watch "+id,sku:"SPEC-"+id,price:1799,
    categorySlug,status:"DRAFT",attributes:{}});
  productId=p.id; productSlug=p.slug;
  await assert.rejects(updateProduct(productId,{status:"ACTIVE"}),/RAM is required/);
  assert.equal((await db.product.findUniqueOrThrow({where:{id:productId}})).status,"DRAFT");
  assert.equal((await listProducts({query:id})).total,0);
});
test("Valid stored specs publish to actual public Product Detail, no invented values",async()=>{
  await updateProduct(productId,{attributes:{ram:"8 GB"},status:"ACTIVE"});
  const row=await getProductBySlug(productSlug);
  assert.ok(row);
  assert.deepEqual(row.specifications,[{label:"RAM",value:"8 GB"}]);
  const mapped=mapBackendProductToCatalog(row);
  assert.deepEqual(mapped.liveSpecifications,[{label:"RAM",value:"8 GB"}]);
  const detail=buildProductDetail(mapped);
  assert.ok(detail.specifications[0].items.some(x=>x.label==="RAM"&&x.value==="8 GB"));
  assert.ok(!detail.specifications[0].items.some(x=>x.label==="Warranty"));
});
test("Invalid typed value and unknown key reject entire admin update without partial price edit",async()=>{
  await assert.rejects(updateProduct(productId,{price:9999,attributes:{ram:"64 GB"}}),
    /allowed option/);
  await assert.rejects(updateProduct(productId,{price:9999,attributes:{hacked:"x",ram:"4 GB"}}),
    /not defined/);
  const p=await db.product.findUniqueOrThrow({where:{id:productId}});
  assert.equal(p.priceMinor,179900);
  assert.deepEqual(p.attributes,{ram:"8 GB"});
});
test("Changing category clears foreign spec keys; when category has required attr, publishing blocks until filled",async()=>{
  await updateProduct(productId,{status:"DRAFT",categorySlug:"spec-"+id+"-clothing"});
  const changed=await db.product.findUniqueOrThrow({where:{id:productId}});
  assert.equal(changed.categoryId,secondId);
  assert.deepEqual(changed.attributes,{});
  await createAttributeDefinition({categoryId:secondId,name:"Fabric",type:"TEXT",required:true});
  await assert.rejects(updateProduct(productId,{status:"ACTIVE"}),/Fabric is required/);
  await updateProduct(productId,{attributes:{fabric:"Cotton"},status:"ACTIVE"});
  const item=await getProductBySlug(productSlug);
  assert.deepEqual(item?.specifications,[{label:"Fabric",value:"Cotton"}]);
});
test("Disabling a spec definition removes it from public view without discarding saved values",async()=>{
  await setAttributeState({id:attrId,active:false});
  const original=await db.attributeDefinition.findUniqueOrThrow({where:{id:attrId}});
  assert.equal(original.active,false);
  const record=await db.product.findUniqueOrThrow({where:{id:productId}});
  assert.deepEqual(record.attributes,{fabric:"Cotton"});
  const item=await getProductBySlug(productSlug);
  assert.ok(item?.specifications.some(x=>x.label==="Fabric"));
  assert.ok(!item?.specifications.some(x=>x.label==="RAM"));
});
