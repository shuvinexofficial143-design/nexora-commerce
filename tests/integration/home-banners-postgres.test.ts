import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after,before,test } from "node:test";
import { getPrisma } from "../../lib/db/prisma";
import { createHomepageBanner,getPublishedHomepageBanners,listAdminHomepageBanners,updateHomepageBanner }
  from "../../lib/home-banners";
function guardIsolatedDatabase() {
  if(process.env.NEXORA_QA_ALLOW_DB_INTEGRATION!=="true")
    throw new Error("Homepage CMS integration requires explicit isolated PostgreSQL opt-in.");
  for(const name of ["DATABASE_URL","DIRECT_URL"]) {
    const url=new URL(process.env[name]||"");
    if(!["localhost","127.0.0.1","::1","[::1]"].includes(url.hostname) ||
      url.username!=="nexora_qa" || url.pathname!=="/nexora_qa")
      throw new Error("Refusing non-disposable database for homepage CMS.");
  }
}
guardIsolatedDatabase();
const db=getPrisma();
const tag=randomUUID().slice(0,8);
const categorySlug="cms-category-"+tag;
const src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop";
let firstId="",secondId="";
before(async()=>{
  await db.$connect();
  await db.category.create({data:{name:"CMS test "+tag,slug:categorySlug}});
});
after(async()=>{await db.$disconnect();});
function fixture(title:string,sortOrder:number) {
  return {title,description:"Campaign for "+tag,imageUrl:src,mobileImageUrl:null,
    ctaText:"Browse products",ctaHref:"/shop?category="+categorySlug,categorySlug,
    sortOrder,published:false,archived:false};
}
test("Owner can create Cline-compatible draft banner; public gets no draft",async()=>{
  const first=await createHomepageBanner(fixture("Banner A "+tag,20));
  const second=await createHomepageBanner(fixture("Banner B "+tag,10));
  firstId=first.id;secondId=second.id;
  const admin=await listAdminHomepageBanners();
  assert.ok(admin.some(x=>x.id===firstId));
  assert.ok(admin.some(x=>x.id===secondId));
  const publicRows=await getPublishedHomepageBanners();
  assert.ok(!publicRows.some(x=>x.id===firstId||x.id===secondId));
});
test("Publish controls display order and safe CTA/description on live homepage",async()=>{
  await updateHomepageBanner(firstId,{published:true});
  await updateHomepageBanner(secondId,{published:true,mobileImageUrl:src,ctaHref:"/search?q=watch"});
  const publicRows=await getPublishedHomepageBanners();
  assert.deepEqual(publicRows.filter(x=>x.id===firstId||x.id===secondId).map(x=>x.id),[secondId,firstId]);
  assert.equal(publicRows.find(x=>x.id===secondId)?.mobileImageUrl,src);
  assert.equal(publicRows.find(x=>x.id===firstId)?.ctaHref,"/shop?category="+categorySlug);
  assert.equal(publicRows.find(x=>x.id===firstId)?.description,"Campaign for "+tag);
});
test("Invalid edit is atomic and cannot expose an external CTA",async()=>{
  await assert.rejects(updateHomepageBanner(firstId,{
    title:"Unsafe campaign",ctaHref:"//evil.example",
  }),/internal store link/);
  const stored=await db.homepageBanner.findUniqueOrThrow({where:{id:firstId}});
  assert.equal(stored.title,"Banner A "+tag);
  assert.equal(stored.ctaHref,"/shop?category="+categorySlug);
  assert.equal(stored.published,true);
  await assert.rejects(updateHomepageBanner("no-such-banner-"+tag,{published:true}),/not found/);
  await assert.rejects(updateHomepageBanner(firstId,{id:"tampered"}),/Unsupported banner update fields/);
});
test("Archived banners fail closed, and explicit unarchiving preserves the draft state",async()=>{
  await updateHomepageBanner(secondId,{archived:true});
  assert.ok(!(await getPublishedHomepageBanners()).some(x=>x.id===secondId));
  await assert.rejects(updateHomepageBanner(secondId,{published:true}),/Unarchive/);
  const unarchive=await updateHomepageBanner(secondId,{archived:false});
  assert.equal(unarchive.published,false);
  assert.ok(!(await getPublishedHomepageBanners()).some(x=>x.id===secondId));
  await updateHomepageBanner(secondId,{published:true});
  assert.ok((await getPublishedHomepageBanners()).some(x=>x.id===secondId));
});
test("Unpublishing a banner removes it without deleting CMS content",async()=>{
  await updateHomepageBanner(firstId,{published:false});
  assert.ok(!(await getPublishedHomepageBanners()).some(x=>x.id===firstId));
  assert.ok((await listAdminHomepageBanners()).some(x=>x.id===firstId));
});
