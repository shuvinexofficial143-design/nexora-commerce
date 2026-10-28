import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {before,after,test} from "node:test";
import {getPrisma} from "../../lib/db/prisma";
import {createProduct,updateProduct} from "../../lib/admin/product-admin";
import {createProductTaxonomy,updateProductTaxonomy,listProductTaxonomy} from "../../lib/admin/product-taxonomy";
import {getProductBySlug} from "../../lib/db/products";
import {mapBackendProductToCatalog} from "../../lib/catalog-backend";
import {listHomepageCategoryDisplay} from "../../lib/storefront/homepage-category-display";
function isolated(){
  if(process.env.NEXORA_QA_ALLOW_DB_INTEGRATION!=="true")
    throw Error("Disposable PostgreSQL opt-in required.");
  for(const key of ["DATABASE_URL","DIRECT_URL"]){
    const u=new URL(process.env[key]||"");
    if(!["127.0.0.1","localhost","::1","[::1]"].includes(u.hostname)||
      u.username!=="nexora_qa"||u.pathname!=="/nexora_qa")
      throw Error("Refusing non-disposable PostgreSQL.");
  }
}
isolated();
const db=getPrisma();
const id=randomUUID().replaceAll("-","").slice(0,11),image="https://images.unsplash.com/photo-111111";
let cat="",brand="",productId="",slug="",catId="";
before(async()=>{
  await db.$connect();
  const c=await createProductTaxonomy({kind:"category",name:"Catalog Visual "+id,slug:"cvis-"+id});
  const b=await createProductTaxonomy({kind:"brand",name:"Catalog Brand "+id,slug:"bvis-"+id});
  cat=c.slug;catId=c.id;brand=b.slug;
});
after(async()=>await db.$disconnect());
test("create persists base compare-at price, and public product only shows verified discount",async()=>{
  const p=await createProduct({name:"Compare Price "+id,sku:"CMP-"+id,price:1299,
    compareAtPrice:1599,categorySlug:cat,brandSlug:brand,status:"ACTIVE"});
  productId=p.id;slug=p.slug;
  assert.equal(p.compareAtMinor,159900);
  const visible=await getProductBySlug(slug);
  assert.ok(visible);
  const item=mapBackendProductToCatalog(visible);
  assert.equal(item.price,1299);
  assert.equal(item.compareAtPrice,1599);
});
test("invalid price update is atomic: no changed price, compare-at or description",async()=>{
  await assert.rejects(updateProduct(productId,{
    price:1699,description:"Should rollback",
  }),/Original price must not be below/);
  await assert.rejects(updateProduct(productId,{
    price:999,compareAtPrice:500,description:"Also rollback",
  }),/Original price must not be below/);
  const current=await db.product.findUniqueOrThrow({where:{id:productId}});
  assert.equal(current.priceMinor,129900);
  assert.equal(current.compareAtMinor,159900);
  assert.notEqual(current.description,"Should rollback");
});
test("clearing original price removes discount; setting a newer valid price restores it",async()=>{
  await updateProduct(productId,{compareAtPrice:null,price:1499});
  const noSale=mapBackendProductToCatalog((await getProductBySlug(slug))!);
  assert.equal(noSale.price,1499);
  assert.equal(noSale.compareAtPrice,undefined);
  await updateProduct(productId,{compareAtPrice:1799});
  assert.equal(mapBackendProductToCatalog((await getProductBySlug(slug))!).compareAtPrice,1799);
});
test("category and brand CMS description/media persist and do not change product price",async()=>{
  await updateProductTaxonomy({kind:"category",slug:cat,description:"Tech accessories",
    imageUrl:image,sortOrder:5});
  await updateProductTaxonomy({kind:"brand",slug:brand,description:"Manufacturer details",
    logoUrl:image,featured:true});
  const options=await listProductTaxonomy();
  assert.equal(options.categories.find(c=>c.slug===cat)?.imageUrl,image);
  assert.equal(options.brands.find(b=>b.slug===brand)?.logoUrl,image);
  const publicCats=await listHomepageCategoryDisplay();
  assert.equal(publicCats.find(c=>c.slug===cat)?.imageUrl,image);
  assert.equal(publicCats.find(c=>c.slug===cat)?.sortOrder,5);
  assert.equal((await db.product.findUniqueOrThrow({where:{id:productId}})).priceMinor,149900);
});
test("malformed CMS media patch rolls back existing category metadata",async()=>{
  await assert.rejects(updateProductTaxonomy({kind:"category",slug:cat,
    description:"Should not save",imageUrl:"https://evil.example/image.png"}),/approved HTTPS/);
  const catRow=await db.category.findUniqueOrThrow({where:{id:catId}});
  assert.equal(catRow.description,"Tech accessories");
  assert.equal(catRow.imageUrl,image);
  await updateProductTaxonomy({kind:"category",slug:cat,imageUrl:null});
  assert.equal((await db.category.findUniqueOrThrow({where:{id:catId}})).imageUrl,null);
});
test("hidden category cannot be promoted in category image list",async()=>{
  await updateProductTaxonomy({kind:"category",slug:cat,visible:false});
  assert.ok(!(await listHomepageCategoryDisplay()).some(c=>c.slug===cat));
  await updateProductTaxonomy({kind:"category",slug:cat,visible:true});
  assert.ok((await listHomepageCategoryDisplay()).some(c=>c.slug===cat));
});
