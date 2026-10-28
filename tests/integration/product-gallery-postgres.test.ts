import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {before,after,test} from "node:test";
import {getPrisma} from "../../lib/db/prisma";
import {createProduct,updateProduct} from "../../lib/admin/product-admin";
import {serializeAdminProductListRow} from "../../lib/admin/product-list-row";
import {getProductBySlug} from "../../lib/db/products";
import {mapBackendProductToCatalog} from "../../lib/catalog-backend";
function disposable(){
  if(process.env.NEXORA_QA_ALLOW_DB_INTEGRATION!=="true")
    throw Error("Disposable PostgreSQL test opt-in required");
  for(const key of ["DATABASE_URL","DIRECT_URL"]){
    const u=new URL(process.env[key]||"");
    if(!["localhost","127.0.0.1","::1","[::1]"].includes(u.hostname)||
      u.username!=="nexora_qa"||u.pathname!=="/nexora_qa")
      throw Error("Refusing production or non-ephemeral database.");
  }
}
disposable();
const db=getPrisma();
const tag=randomUUID().replaceAll("-","").slice(0,12);
const poster="https://images.unsplash.com/photo-111";
const a="https://images.unsplash.com/photo-222";
const b="https://images.unsplash.com/photo-333";
const c="https://images.unsplash.com/photo-444";
const video="https://youtu.be/abcdefghijk";
let productId="",slug="";
before(async()=>await db.$connect());
after(async()=>await db.$disconnect());
const media=()=>db.productImage.findMany({where:{productId},orderBy:{sortOrder:"asc"}});
test("Cline gallery integrates into GPT create while preserving poster/video transactionally",async()=>{
  const product=await createProduct({name:"Gallery QA "+tag,sku:"GAL-"+tag,price:850,
    status:"ACTIVE",posterUrl:poster,videoUrl:video,images:[a,b]});
  productId=product.id;slug=product.slug;
  const records=await media();
  assert.deepEqual(records.map(x=>[x.sortOrder,x.url]),[
    [0,poster],[1,video],[10,a],[11,b],
  ]);
  const row=await db.product.findUniqueOrThrow({where:{id:productId},include:{
    brand:true,category:true,inventory:true,variants:true,images:true,
  }});
  const result=serializeAdminProductListRow(row);
  assert.equal(result.posterUrl,poster);
  assert.equal(result.videoUrl,video);
  assert.deepEqual(result.galleryImages,[a,b]);
  const publicProduct=await getProductBySlug(slug);
  assert.ok(publicProduct);
  const card=mapBackendProductToCatalog(publicProduct);
  assert.deepEqual(card.liveImages.map(x=>x.src),[poster,a,b]);
});
test("Poster-only edit never mutates extra gallery and video media",async()=>{
  await updateProduct(productId,{posterUrl:c});
  const records=await media();
  assert.deepEqual(records.map(x=>[x.sortOrder,x.url]),[
    [0,c],[1,video],[10,a],[11,b],
  ]);
});
test("Gallery reorder/removal changes only reserved gallery rows, leaves poster and video untouched",async()=>{
  await updateProduct(productId,{images:[b,a]});
  assert.deepEqual((await media()).map(x=>[x.sortOrder,x.url]),[
    [0,c],[1,video],[10,b],[11,a],
  ]);
  await updateProduct(productId,{images:[a]});
  assert.deepEqual((await media()).map(x=>[x.sortOrder,x.url]),[
    [0,c],[1,video],[10,a],
  ]);
});
test("Invalid gallery update fails before any product price or media modifications",async()=>{
  const old=await media();
  await assert.rejects(updateProduct(productId,{
    price:12345,posterUrl:poster,images:[a,a],
  }),/Duplicate gallery/);
  assert.deepEqual((await media()).map(x=>[x.sortOrder,x.url]),
    old.map(x=>[x.sortOrder,x.url]));
  const row=await db.product.findUniqueOrThrow({where:{id:productId}});
  assert.equal(row.priceMinor,85000);
});
test("Removing primary poster does not silently delete first gallery image",async()=>{
  await updateProduct(productId,{posterUrl:""});
  assert.deepEqual((await media()).map(x=>[x.sortOrder,x.url]),[
    [1,video],[10,a],
  ]);
  const admin=serializeAdminProductListRow(await db.product.findUniqueOrThrow({
    where:{id:productId},include:{brand:true,category:true,inventory:true,variants:true,images:true},
  }));
  assert.equal(admin.posterUrl,null);
  assert.deepEqual(admin.galleryImages,[a]);
  const shown=mapBackendProductToCatalog((await getProductBySlug(slug))!);
  assert.equal(shown.image,a);
  await updateProduct(productId,{images:[]});
  assert.deepEqual((await media()).map(x=>[x.sortOrder,x.url]),[[1,video]]);
});
