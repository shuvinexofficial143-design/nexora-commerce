import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {before,after,test} from "node:test";
import {getPrisma} from "../../lib/db/prisma";
import {createAttributeDefinition} from "../../lib/admin/product-attributes";
import {listProducts,listPublicAttributeFacets} from "../../lib/db/products";
import {parseLiveCatalogQuery,toProductListQuery} from "../../lib/storefront/catalog-query";
function isolated(){
  if(process.env.NEXORA_QA_ALLOW_DB_INTEGRATION!=="true")throw Error("Isolated PG opt-in required");
  for(const key of ["DATABASE_URL","DIRECT_URL"]){
    const u=new URL(process.env[key]||"");
    if(!["127.0.0.1","localhost","::1","[::1]"].includes(u.hostname)||
       u.username!=="nexora_qa"||u.pathname!=="/nexora_qa")throw Error("Refuse non-disposable DB");
  }
}
isolated();
const db=getPrisma();
const tag=randomUUID().replaceAll("-","").slice(0,11),prefix="facqa-"+tag;
let catSlug="",catId="",brandId="",archivedId="";
before(async()=>{
  await db.$connect();
  const category=await db.category.create({data:{name:"Filter QA "+tag,slug:prefix}});
  const hidden=await db.category.create({data:{name:"Hidden QA "+tag,slug:prefix+"-hidden",visible:false}});
  const brand=await db.brand.create({data:{name:"Test brand "+tag,slug:prefix+"-brand"}});
  catId=category.id;catSlug=category.slug;brandId=brand.id;archivedId=hidden.id;
  for(const definition of [
    {name:"RAM",type:"SELECT" as const,options:["4 GB","8 GB"]},
    {name:"Colour",type:"COLOR" as const,options:["black","blue"]},
    {name:"Materials",type:"TEXT" as const,options:[]},
    {name:"Wireless",type:"BOOLEAN" as const,options:[]},
    {name:"Features",type:"MULTI_SELECT" as const,options:["gps","lte","wifi"]},
  ])await createAttributeDefinition({categoryId:catId,...definition});
  const rows=[
    ["a",25000,{ram:"8 GB",colour:"blue",materials:"Titanium",wireless:true,features:["gps","lte"]}],
    ["b",45000,{ram:"4 GB",colour:"black",materials:"Aluminium",wireless:true,features:["wifi"]}],
    ["c",35000,{ram:"8 GB",colour:"black",materials:"Titanium",wireless:false,features:["gps"]}],
    ["d",15000,{ram:"4 GB",colour:"blue",materials:"Cotton",wireless:false,features:[]}],
  ] as const;
  for(const [key,price,attributes] of rows){
    await db.product.create({data:{
      slug:prefix+"-"+key,sku:("FQA-"+tag+"-"+key).toUpperCase(),
      name:"Attribute filter "+tag+" "+key,
      description:"DB filtering "+tag,priceMinor:price,status:"ACTIVE",
      categoryId:catId,brandId,attributes:attributes as never,
    }});
  }
  await db.product.create({data:{
    slug:prefix+"-hidden",sku:"FQA-HIDDEN-"+tag,name:"Attribute filter "+tag+" hidden",
    description:"Do not leak",priceMinor:100,status:"ACTIVE",
    categoryId:archivedId,brandId,attributes:{ram:"8 GB",colour:"blue"},
  }});
  await db.product.create({data:{
    slug:prefix+"-draft",sku:"FQA-DRAFT-"+tag,name:"Attribute filter "+tag+" draft",
    description:"Do not leak",priceMinor:100,status:"DRAFT",
    categoryId:catId,brandId,attributes:{ram:"8 GB",colour:"blue"},
  }});
});
after(async()=>await db.$disconnect());
const filters=(...values:string[])=>toProductListQuery(parseLiveCatalogQuery({q:tag,attr:values}));
test("owner-defined facets only, scoped to public category with active products",async()=>{
  const list=await listPublicAttributeFacets();
  const mine=list.filter(f=>f.category===catSlug);
  assert.equal(mine.length,5);
  assert.ok(mine.find(f=>f.slug==="ram")?.options.includes("8 GB"));
  assert.deepEqual(mine.find(f=>f.slug==="wireless")?.options,["true","false"]);
  assert.ok(!list.some(f=>f.category===prefix+"-hidden"));
});
test("same category attribute accepts OR values; different attributes AND before paging",async()=>{
  const all=await listProducts(filters(catSlug+".ram:8 GB",catSlug+".ram:4 GB"));
  assert.equal(all.total,4);
  const both=await listProducts(filters(catSlug+".ram:8 GB",catSlug+".colour:blue"));
  assert.equal(both.total,1);assert.equal(both.items[0].slug,prefix+"-a");
  const none=await listProducts(filters(catSlug+".ram:8 GB",catSlug+".colour:orange"));
  assert.equal(none.total,0);
});
test("MULTI_SELECT ANY option and BOOLEAN false work against exact typed JSON",async()=>{
  const selected=await listProducts(filters(catSlug+".features:gps"));
  assert.equal(selected.total,2);
  const boolean=await listProducts(filters(catSlug+".wireless:false"));
  assert.equal(boolean.total,2);
  const material=await listProducts(filters(catSlug+".materials:Titanium"));
  assert.equal(material.total,2);
});
test("attribute and SQL effective price/stock pagination use filtered counts, no leaks",async()=>{
  const original=filters(catSlug+".ram:8 GB");
  const first=await listProducts({...original,sort:"price-low",limit:1,offset:0});
  const second=await listProducts({...original,sort:"price-low",limit:1,offset:1});
  assert.equal(first.total,2);
  assert.equal(second.total,2);
  assert.equal(first.items[0].slug,prefix+"-a");
  assert.equal(second.items[0].slug,prefix+"-c");
  const priced=await listProducts({...original,minPriceMinor:30000,sort:"price-low"});
  assert.equal(priced.total,1);assert.equal(priced.items[0].slug,prefix+"-c");
});
test("hidden category, inactive definition and inactive brand fail closed",async()=>{
  await db.attributeDefinition.updateMany({where:{categoryId:catId,slug:"ram"},data:{active:false}});
  assert.equal((await listProducts(filters(catSlug+".ram:8 GB"))).total,0);
  await db.attributeDefinition.updateMany({where:{categoryId:catId,slug:"ram"},data:{active:true}});
  await db.category.update({where:{id:catId},data:{visible:false}});
  assert.equal((await listProducts(filters(catSlug+".ram:8 GB"))).total,0);
  assert.ok(!(await listPublicAttributeFacets()).some(f=>f.category===catSlug));
  await db.category.update({where:{id:catId},data:{visible:true}});
  await db.brand.update({where:{id:brandId},data:{active:false}});
  assert.equal((await listProducts(filters(catSlug+".ram:8 GB"))).total,0);
});
