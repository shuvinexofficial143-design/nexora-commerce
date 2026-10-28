import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, test } from "node:test";
import { getPrisma } from "../../lib/db/prisma";
import { createProductTaxonomy, listProductTaxonomy } from "../../lib/admin/product-taxonomy";
import { createProduct, updateProduct } from "../../lib/admin/product-admin";
import { listProducts } from "../../lib/db/products";
import { mapBackendProductToCatalog } from "../../lib/catalog-backend";
import { buildHomepageCollection } from "../../lib/storefront/homepage-collection";

function requireDisposableDatabase() {
  if (process.env.NEXORA_QA_ALLOW_DB_INTEGRATION !== "true")
    throw new Error("Explicit isolated PostgreSQL test opt-in missing");
  for (const env of ["DATABASE_URL", "DIRECT_URL"]) {
    const url = new URL(process.env[env] || "");
    if (!["localhost","127.0.0.1","::1","[::1]"].includes(url.hostname) ||
        url.pathname !== "/nexora_qa" || url.username !== "nexora_qa")
      throw new Error("Refusing non-ephemeral or production database");
  }
}
requireDisposableDatabase();
const prisma=getPrisma();
const unique=randomUUID().replaceAll("-","").slice(0,11);
const id="qaadmin"+unique;
let categorySlug="";
let brandSlug="";
let productId="";
let warehouseId="";
before(async()=>{await prisma.$connect();});
after(async()=>{await prisma.$disconnect();});

test("owner-created taxonomy is real SQL, unique and visible in admin options",async()=>{
  const cat=await createProductTaxonomy({kind:"category",name:"Live Category "+id,slug:id+"-fashion"});
  const brand=await createProductTaxonomy({kind:"brand",name:"Live Brand "+id,slug:id+"-brand"});
  categorySlug=cat.slug;
  brandSlug=brand.slug;
  const options=await listProductTaxonomy();
  assert.ok(options.categories.some(v=>v.slug===categorySlug && v.id===cat.id));
  assert.ok(options.brands.some(v=>v.slug===brandSlug && v.id===brand.id));
  await assert.rejects(createProductTaxonomy({kind:"category",name:"Duplicate",slug:cat.slug}),/already exists/);
});
test("admin product draft never leaks; publishing requires actual public catalog row",async()=>{
  const product=await createProduct({name:"Admin Home "+id,sku:"ADMH-"+unique,price:899,
    description:"Created through real admin Product function",categorySlug,brandSlug,status:"DRAFT"});
  productId=product.id;
  const draft=await listProducts({query:id,limit:100});
  assert.ok(!draft.items.some(x=>x.id===product.id));
  await updateProduct(product.id,{status:"ACTIVE"});
  const published=await listProducts({query:id,limit:100});
  const row=published.items.find(x=>x.id===product.id);
  assert.ok(row);
  assert.equal(row.category?.slug,categorySlug);
  assert.equal(row.brand?.slug,brandSlug);
  assert.equal(row.description,"Created through real admin Product function");
  // Availability remains zero until actual inventory is recorded.
  assert.equal(mapBackendProductToCatalog(row).inventory,0);
  assert.equal(buildHomepageCollection([mapBackendProductToCatalog(row)]).recent.length,0);
});
test("admin stock + price update immediately propagates to homepage, Shop and category filter",async()=>{
  const warehouse=await prisma.warehouse.create({data:{
    code:"ADMH-"+unique,name:"Admin Home QA Warehouse",city:"Tarana",state:"MP",
  }});
  warehouseId=warehouse.id;
  await prisma.inventoryItem.create({data:{productId,warehouseId,onHand:11,reserved:3}});
  const old=await listProducts({query:id,limit:100});
  const row=old.items.find(p=>p.id===productId);
  assert.ok(row);
  const oldCard=mapBackendProductToCatalog(row);
  assert.equal(oldCard.price,899);
  assert.equal(oldCard.inventory,8);
  const oldHome=buildHomepageCollection([oldCard]);
  assert.equal(oldHome.spotlight?.slug,row.slug);
  assert.equal(oldHome.categories[0].slug,categorySlug);
  assert.equal(oldHome.categories[0].productCount,1);
  assert.ok(oldHome.brands.some(b=>b.name.includes(id)));
  // Owner edits price and moves the product to a different existing category.
  const second=await createProductTaxonomy({kind:"category",name:"Electronics "+id,slug:id+"-electronics"});
  await updateProduct(productId,{price:1299,description:"Edited from admin "+id,categorySlug:second.slug});
  const newListing=await listProducts({query:id,categories:[second.slug],limit:100});
  const updated=newListing.items.find(p=>p.id===productId);
  assert.ok(updated);
  const nextCard=mapBackendProductToCatalog(updated);
  assert.equal(nextCard.price,1299);
  assert.equal(nextCard.inventory,8);
  assert.equal(updated.description,"Edited from admin "+id);
  assert.equal(buildHomepageCollection([nextCard]).categories[0].slug,second.slug);
  const oldCategory=await listProducts({query:id,categories:[categorySlug],limit:100});
  assert.ok(!oldCategory.items.some(p=>p.id===productId));
  // Unknown catalog slugs must be rejected WITHOUT partial price changes.
  await assert.rejects(updateProduct(productId,{
    price:7777,categorySlug:"missing-"+id,
  }),/Category no longer exists/);
  const persisted=await prisma.product.findUniqueOrThrow({where:{id:productId}});
  assert.equal(persisted.priceMinor,129900);
  assert.equal(persisted.categoryId,second.id);
});
test("SKU-specific admin changes drive homepage saleability; archiving removes product",async()=>{
  const variant=await prisma.productVariant.create({data:{
    productId,sku:"ADMIN-VAR-"+unique,choices:{size:"large"},
    signature:JSON.stringify({size:"large"}),priceMinor:249900,
    onHand:7,reserved:2,active:true,
  }});
  const rows=await listProducts({query:id,limit:100});
  const mapped=mapBackendProductToCatalog(rows.items.find(p=>p.id===productId)!);
  assert.equal(mapped.price,2499);
  assert.equal(mapped.inventory,5);
  assert.equal(mapped.hasPricedVariants,true);
  assert.equal(buildHomepageCollection([mapped]).spotlight?.slug,mapped.slug);
  // Warehouse has available stock but all priced variants are inactive.
  await prisma.productVariant.update({where:{id:variant.id},data:{active:false}});
  const inactive=mapBackendProductToCatalog(
    (await listProducts({query:id,limit:100})).items.find(p=>p.id===productId)!);
  assert.equal(inactive.stock,"out-of-stock");
  assert.equal(inactive.inventory,0);
  assert.equal(buildHomepageCollection([inactive]).recent.length,0);
  await updateProduct(productId,{status:"ARCHIVED"});
  assert.ok(!(await listProducts({query:id,limit:100})).items.some(p=>p.id===productId));
});
test("admin rejects unknown category on product creation; no orphan product inserted",async()=>{
  await assert.rejects(createProduct({name:"Missing Taxonomy "+id,sku:"NO-TAX-"+unique,
    price:300,categorySlug:"not-real-"+id,brandSlug}),/Category no longer exists/);
  assert.equal(await prisma.product.count({where:{sku:"NO-TAX-"+unique}}),0);
});
