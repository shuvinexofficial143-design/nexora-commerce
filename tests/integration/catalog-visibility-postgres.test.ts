import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { before,after,test } from "node:test";
import { getPrisma } from "../../lib/db/prisma";
import { createProductTaxonomy, updateProductTaxonomy, listProductTaxonomy } from "../../lib/admin/product-taxonomy";
import { eligiblePublicCategoryIds } from "../../lib/commerce/catalog-visibility";
import { listProducts,getProductBySlug,listPublicCatalogFacets } from "../../lib/db/products";
import { createCheckoutPreview,validateCheckoutPreview } from "../../lib/commerce/checkout-preview";
import { validateOrder } from "../../lib/server/backend";
import { createOrderWithOutcome } from "../../lib/db/orders";
import { createHomepageBanner,getPublishedHomepageBanners } from "../../lib/home-banners";
function isolation(){
  if(process.env.NEXORA_QA_ALLOW_DB_INTEGRATION!=="true")
    throw Error("QA isolated PostgreSQL required.");
  for(const name of ["DATABASE_URL","DIRECT_URL"]){
    const url=new URL(process.env[name]||"");
    if(!["localhost","127.0.0.1","::1","[::1]"].includes(url.hostname) ||
      url.username!=="nexora_qa" || url.pathname!=="/nexora_qa")
      throw Error("Refusing non-disposable database.");
  }
}
isolation();
const db=getPrisma();
const id=randomUUID().replaceAll("-","").slice(0,12);
const sl="qa-cat-"+id;
let root="",child="",leaf="",brand="",productId="",productSlug="",userId="";
let stockId="",attemptKey="";
before(async()=>{
  await db.$connect();
  const a=await createProductTaxonomy({kind:"category",name:"Root "+id,slug:sl+"-root"});
  const b=await createProductTaxonomy({kind:"category",name:"Child "+id,slug:sl+"-child",parentSlug:a.slug});
  const c=await createProductTaxonomy({kind:"category",name:"Leaf "+id,slug:sl+"-leaf",parentSlug:b.slug});
  const d=await createProductTaxonomy({kind:"brand",name:"Brand "+id,slug:sl+"-brand"});
  root=a.slug;child=b.slug;leaf=c.slug;brand=d.slug;
  const product=await db.product.create({data:{
    slug:sl+"-product",name:"Advanced Catalog "+id,sku:"CAT-"+id,
    description:"Visibility and checkout QA",priceMinor:75000,status:"ACTIVE",
    categoryId:c.id,brandId:d.id,
  }});
  productId=product.id;productSlug=product.slug;
  const warehouse=await db.warehouse.create({data:{
    code:"CAT-"+id,name:"QA Catalog",city:"Ujjain",state:"MP",
  }});
  const stock=await db.inventoryItem.create({data:{
    productId,warehouseId:warehouse.id,onHand:8,reserved:0,
  }});
  stockId=stock.id;
  const user=await db.user.create({data:{
    email:"qa-catalog-"+id+"@example.invalid",name:"QA Catalog",
    passwordHash:"qa-no-login",
  }});
  userId=user.id;
  attemptKey="qa-hierarchy-"+id;
});
after(async()=>{await db.$disconnect();});
const quote=()=>createCheckoutPreview(validateCheckoutPreview({
  items:[{slug:productSlug,quantity:1,clientPriceMinor:75000}],
}));
const payload=()=>validateOrder({
  items:[{productId,quantity:1,expectedUnitPriceMinor:75000}],
  shippingAddress:{fullName:"QA Customer",phone:"9876543210",
    line1:"QA Test Street",city:"Ujjain",state:"MP",postalCode:"456001"},
  paymentMethod:"cod",contactEmail:"qa-catalog-"+id+"@example.invalid",
  deliveryMethod:"standard",
});
async function shouldBeVisible(expected:boolean){
  const listed=await listProducts({query:id});
  const priced=await listProducts({query:id,sort:"price-low",stock:"available",minPriceMinor:74000});
  assert.equal(listed.items.some(x=>x.id===productId),expected);
  assert.equal(priced.items.some(x=>x.id===productId),expected);
  assert.equal(Boolean(await getProductBySlug(productSlug)),expected);
  assert.equal((await quote()).valid,expected);
}
test("Recursive arbitrary-depth hierarchy is visible before any owner restrictions",async()=>{
  const allowed=await eligiblePublicCategoryIds();
  assert.ok(allowed.length>=3);
  const options=await listProductTaxonomy();
  assert.equal(options.categories.find(x=>x.slug===leaf)?.parentId,
    options.categories.find(x=>x.slug===child)?.id);
  await shouldBeVisible(true);
});
test("Hiding any ancestor hides ALL descendant products in Shop, Search, Price SQL, facets, detail and checkout",async()=>{
  await updateProductTaxonomy({kind:"category",slug:root,visible:false});
  const visible=await eligiblePublicCategoryIds();
  const option=await listProductTaxonomy();
  assert.ok(!visible.includes(option.categories.find(x=>x.slug===leaf)!.id));
  await shouldBeVisible(false);
  const facets=await listPublicCatalogFacets();
  assert.ok(!facets.categories.some(x=>x.slug===leaf));
  assert.ok(!facets.brands.some(x=>x.slug===brand));
  await assert.rejects(createOrderWithOutcome(userId,payload(),attemptKey),/products are unavailable/);
  assert.equal(await db.order.count({where:{userId}}),0);
  assert.equal((await db.inventoryItem.findUniqueOrThrow({where:{id:stockId}})).reserved,0);
  await updateProductTaxonomy({kind:"category",slug:root,visible:true});
  await shouldBeVisible(true);
});
test("Archiving an intermediate category hides descendants even when root is visible",async()=>{
  await updateProductTaxonomy({kind:"category",slug:child,archived:true});
  await shouldBeVisible(false);
  await updateProductTaxonomy({kind:"category",slug:child,archived:false});
  await shouldBeVisible(true);
});
test("Inactive brand prevents checkout, all catalog queries; Featured alone does not override active",async()=>{
  await updateProductTaxonomy({kind:"brand",slug:brand,featured:true,active:false});
  await shouldBeVisible(false);
  const facets=await listPublicCatalogFacets();
  assert.ok(!facets.brands.some(x=>x.slug===brand));
  await assert.rejects(createOrderWithOutcome(userId,payload(),attemptKey),/products are unavailable/);
  await updateProductTaxonomy({kind:"brand",slug:brand,active:true});
  await shouldBeVisible(true);
});
test("Category cycle edits fail atomically, and a committed idempotent order replays after catalog hiding",async()=>{
  await assert.rejects(updateProductTaxonomy({kind:"category",slug:root,parentSlug:leaf}),/cycle/);
  const current=await db.category.findUniqueOrThrow({where:{slug:root}});
  assert.equal(current.parentId,null);
  const created=await createOrderWithOutcome(userId,payload(),attemptKey);
  assert.equal(created.created,true);
  const before=(await db.inventoryItem.findUniqueOrThrow({where:{id:stockId}})).reserved;
  assert.equal(before,1);
  await updateProductTaxonomy({kind:"brand",slug:brand,active:false});
  await assert.rejects(createOrderWithOutcome(userId,payload(),"qa-new-"+id),/products are unavailable/);
  const recovered=await createOrderWithOutcome(userId,payload(),attemptKey);
  assert.equal(recovered.created,false);
  assert.equal(recovered.order.id,created.order.id);
  assert.equal((await db.inventoryItem.findUniqueOrThrow({where:{id:stockId}})).reserved,before);
  await updateProductTaxonomy({kind:"brand",slug:brand,active:true});
});

test("Published CMS banner is hidden when linked category/ancestor is hidden",async()=>{
  const banner=await createHomepageBanner({
    title:"Real linked CMS "+id,description:"Visible only for eligible category",
    imageUrl:"https://images.unsplash.com/photo-1523275335684-37898b6baf30",
    ctaText:"Shop category",ctaHref:"/shop?category="+leaf,
    categorySlug:leaf,sortOrder:0,published:true,archived:false,
  });
  assert.ok((await getPublishedHomepageBanners()).some(x=>x.id===banner.id));
  await updateProductTaxonomy({kind:"category",slug:root,archived:true});
  assert.ok(!(await getPublishedHomepageBanners()).some(x=>x.id===banner.id));
  await updateProductTaxonomy({kind:"category",slug:root,archived:false});
  assert.ok((await getPublishedHomepageBanners()).some(x=>x.id===banner.id));
});
