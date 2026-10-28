import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after,before,test } from "node:test";
import { getPrisma } from "../../lib/db/prisma";
import { reorderHomepageBanners,BannerReorderConflict } from "../../lib/admin/banner-order";
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


test("Public homepage fills valid positions after skipping six higher-ranked hidden-category banners",async()=>{
  const hidden=await db.category.create({data:{name:"Hidden promo "+tag,
    slug:"cms-hidden-"+tag,visible:false}});
  for(let i=0;i<6;i++)await createHomepageBanner({
    ...fixture("Hidden "+i+" "+tag,0),
    categorySlug:hidden.slug,ctaHref:"/shop?category="+hidden.slug,published:true,
  });
  const eligible=await createHomepageBanner({
    ...fixture("Available after hidden "+tag,1),published:true,
  });
  const results=await getPublishedHomepageBanners();
  assert.ok(results.some(x=>x.id===eligible.id),
    "a valid banner is not starved by the first five hidden-category rows");
  assert.equal(results.length<=5,true);
  assert.ok(results.every(x=>!x.title.startsWith("Hidden ")));
});
test("All non-archived banners can be reordered atomically with exact revisions",async()=>{
  const active=await db.homepageBanner.findMany({
    where:{archived:false},orderBy:[{sortOrder:"asc"},{updatedAt:"desc"}],
    select:{id:true,updatedAt:true},
  });
  assert.ok(active.length>=2&&active.length<=100);
  const ordered=[...active].reverse().map(row=>({
    id:row.id,updatedAt:row.updatedAt.toISOString(),
  }));
  const result=await reorderHomepageBanners({items:ordered});
  assert.equal(result.reordered,ordered.length);
  const after=await db.homepageBanner.findMany({where:{archived:false},
    orderBy:[{sortOrder:"asc"},{id:"asc"}],select:{id:true,sortOrder:true}});
  assert.deepEqual(after.map(row=>row.id),ordered.map(row=>row.id));
  assert.deepEqual(after.map(row=>row.sortOrder),ordered.map((_,i)=>i));
  const published=await getPublishedHomepageBanners();
  assert.ok(published.length<=5);
  assert.ok(published.every(x=>!x.title.startsWith("Hidden ")));
});
test("Stale revisions and missing/archived banner IDs abort entire reorder",async()=>{
  const active=await db.homepageBanner.findMany({where:{archived:false},
    orderBy:{sortOrder:"asc"},select:{id:true,sortOrder:true,updatedAt:true}});
  const before=active.map(row=>({id:row.id,sortOrder:row.sortOrder}));
  const stale=active.map(row=>({
    id:row.id,updatedAt:row.updatedAt.toISOString(),
  }));
  // Deliberately alter one pinned revision to test concurrency without
  // modifying any production-like state outside this disposable database.
  stale[0].updatedAt="2020-01-01T00:00:00.000Z";
  await assert.rejects(reorderHomepageBanners({items:stale}),BannerReorderConflict);
  const archived=await db.homepageBanner.findFirst({where:{archived:true}});
  if(archived){
    const wrong=active.map(row=>({id:row.id,updatedAt:row.updatedAt.toISOString()}));
    wrong[0]={id:archived.id,updatedAt:archived.updatedAt.toISOString()};
    await assert.rejects(reorderHomepageBanners({items:wrong}),BannerReorderConflict);
  }
  const after=await db.homepageBanner.findMany({where:{archived:false},
    orderBy:{sortOrder:"asc"},select:{id:true,sortOrder:true}});
  assert.deepEqual(after.map(x=>({id:x.id,sortOrder:x.sortOrder})),before);
});
