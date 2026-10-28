"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { AdminMediaUpload } from "@/components/admin/admin-media-upload";
import { BannerPreview } from "@/components/admin/banner-preview";

type Banner = {
  id:string; title:string; description:string|null;
  imageUrl:string; mobileImageUrl:string|null;
  ctaText:string; ctaHref:string; categorySlug:string|null;
  sortOrder:number; published:boolean; archived:boolean; updatedAt:string;
};
type Draft = {
  title:string; description:string; imageUrl:string; mobileImageUrl:string;
  ctaText:string; ctaHref:string; categorySlug:string;
  sortOrder:string; published:boolean; archived:boolean;
};
const NEW:Draft={
  title:"",description:"",imageUrl:"",mobileImageUrl:"",
  ctaText:"Shop collection",ctaHref:"/shop",categorySlug:"",
  sortOrder:"0",published:false,archived:false,
};
function toDraft(banner:Banner):Draft {
  return {
    title:banner.title,description:banner.description??"",
    imageUrl:banner.imageUrl,mobileImageUrl:banner.mobileImageUrl??"",
    ctaText:banner.ctaText,ctaHref:banner.ctaHref,
    categorySlug:banner.categorySlug??"",sortOrder:String(banner.sortOrder),
    published:banner.published,archived:banner.archived,
  };
}
async function ownerBannerFetch<T>(url:string,method:"GET"|"POST"|"PATCH"="GET",body?:unknown):Promise<T> {
  const response=await fetch(url,{
    method,credentials:"same-origin",cache:"no-store",
    ...(body===undefined?{}:{headers:{"Content-Type":"application/json"},body:JSON.stringify(body)}),
  });
  const result=(await response.json().catch(()=>null)) as {ok?:boolean;error?:string;data?:T}|null;
  if (!response.ok || !result?.ok || result.data===undefined)
    throw new Error(result?.error ?? "Could not save homepage banner.");
  return result.data;
}
function BannerForm({initial,save,busy}:{initial:Draft;save:(draft:Draft)=>Promise<boolean>;busy:boolean}) {
  const [form,setForm]=useState<Draft>(initial);
  function field<K extends keyof Draft>(key:K,value:Draft[K]) {
    setForm(current=>({...current,[key]:value}));
  }
  async function submit(event:React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const saved=await save(form);
    if (saved) setForm({...initial});
  }
  return (
    <form onSubmit={event=>{void submit(event);}} className="grid gap-3 sm:grid-cols-2">
      <label className="block text-xs font-bold sm:col-span-2">Banner headline
        <input required minLength={2} maxLength={120} value={form.title}
          onChange={event=>field("title",event.target.value)}
          placeholder="Discover new arrivals" className="mt-1 w-full rounded-xl border border-black/15 bg-white px-3 py-3"/>
      </label>
      <label className="block text-xs font-bold sm:col-span-2">Description
        <textarea maxLength={350} rows={2} value={form.description}
          onChange={event=>field("description",event.target.value)}
          className="mt-1 w-full rounded-xl border border-black/15 bg-white px-3 py-3"/>
      </label>
      <label className="block text-xs font-bold sm:col-span-2">Desktop image URL (HTTPS, approved storage)
        <input required type="url" value={form.imageUrl}
          onChange={event=>field("imageUrl",event.target.value)}
          placeholder="https://res.cloudinary.com/..." className="mt-1 w-full rounded-xl border border-black/15 bg-white px-3 py-3"/>
        <AdminMediaUpload resourceType="image" label="Upload desktop banner"
          onUploaded={url=>field("imageUrl",url)}/>
      </label>
      <label className="block text-xs font-bold sm:col-span-2">Mobile image URL (optional)
        <input type="url" value={form.mobileImageUrl}
          onChange={event=>field("mobileImageUrl",event.target.value)}
          placeholder="https://res.cloudinary.com/..." className="mt-1 w-full rounded-xl border border-black/15 bg-white px-3 py-3"/>
        <AdminMediaUpload resourceType="image" label="Upload mobile banner"
          onUploaded={url=>field("mobileImageUrl",url)}/>
      </label>
      <label className="block text-xs font-bold">CTA button text
        <input required minLength={2} maxLength={40} value={form.ctaText}
          onChange={event=>field("ctaText",event.target.value)}
          className="mt-1 w-full rounded-xl border border-black/15 bg-white px-3 py-3"/>
      </label>
      <label className="block text-xs font-bold">Internal CTA destination
        <input required value={form.ctaHref}
          onChange={event=>field("ctaHref",event.target.value)}
          placeholder="/shop?category=electronics"
          className="mt-1 w-full rounded-xl border border-black/15 bg-white px-3 py-3"/>
      </label>
      <label className="block text-xs font-bold">Category slug (optional)
        <input value={form.categorySlug}
          onChange={event=>field("categorySlug",event.target.value)}
          placeholder="electronics" className="mt-1 w-full rounded-xl border border-black/15 bg-white px-3 py-3"/>
      </label>
      <label className="block text-xs font-bold">Display order (0–1000)
        <input type="number" min={0} max={1000} step={1} required value={form.sortOrder}
          onChange={event=>field("sortOrder",event.target.value)}
          className="mt-1 w-full rounded-xl border border-black/15 bg-white px-3 py-3"/>
      </label>
      <label className="flex items-center gap-2 rounded-xl border border-black/10 px-3 py-3 text-sm font-bold">
        <input type="checkbox" checked={form.published} disabled={form.archived}
          onChange={event=>field("published",event.target.checked)} />
        Publish on homepage
      </label>
      <label className="flex items-center gap-2 rounded-xl border border-black/10 px-3 py-3 text-sm font-bold">
        <input type="checkbox" checked={form.archived}
          onChange={event=>setForm(current=>({...current,archived:event.target.checked,
            published:event.target.checked?false:current.published}))} />
        Archived (hidden from customers)
      </label>
      <BannerPreview banner={form}/>
      <button type="submit" disabled={busy}
        className="rounded-full bg-black px-5 py-3 text-sm font-black text-white disabled:opacity-50 sm:col-span-2">
        {busy?"Saving…":"Save banner"}
      </button>
    </form>
  );
}
function payload(form:Draft) {
  return {...form,
    imageUrl:form.imageUrl.trim(),mobileImageUrl:form.mobileImageUrl.trim()||null,
    description:form.description.trim()||null,categorySlug:form.categorySlug.trim()||null,
    sortOrder:Number(form.sortOrder),
    published:form.archived?false:form.published,
  };
}
export function HomepageBannersPanel() {
  const [rows,setRows]=useState<Banner[]>([]);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [loaded,setLoaded]=useState(false);
  const load=useCallback(async()=>{
    try {
      const response=await ownerBannerFetch<Banner[]>("/api/admin-app/banners");
      setRows(response);setLoaded(true);setError("");
    } catch(error) {setError(error instanceof Error?error.message:"Cannot read banners.");}
  },[]);
  useEffect(()=>{queueMicrotask(()=>{void load();});},[load]);
  async function write(url:string,method:"POST"|"PATCH",data:unknown) {
    setError("");setBusy(true);
    try {
      await ownerBannerFetch<Banner>(url,method,data);
      await load();
      return true;
    } catch(error) {setError(error instanceof Error?error.message:"Cannot update banner.");return false;}
    finally {setBusy(false);}
  }
  async function moveBanner(id:string,direction:-1|1){
    const active=rows.filter(row=>!row.archived);
    if(active.length<2||active.length>100||busy)return;
    const index=active.findIndex(row=>row.id===id);
    const next=index+direction;
    if(index<0||next<0||next>=active.length)return;
    const reordered=[...active];
    [reordered[index],reordered[next]]=[reordered[next],reordered[index]];
    setBusy(true);setError("");
    try{
      await ownerBannerFetch<{reordered:number}>("/api/admin-app/banners/reorder","POST",{
        items:reordered.map(row=>({id:row.id,updatedAt:row.updatedAt})),
      });
      await load();
    }catch(error){setError(error instanceof Error?error.message:"Cannot change banner order.");}
    finally{setBusy(false);}
  }
  return (
    <div className="space-y-5">
      <header>
        <p className="text-xs font-black uppercase tracking-[.2em] text-black/45">Storefront CMS</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight">Homepage banners</h1>
        <p className="mt-2 max-w-2xl text-sm text-black/60">
          Create and schedule display order. Draft and archived banners never appear publicly. Publishing
          changes the banner on the next live homepage request, after the final database release.
        </p>
      </header>
      {error?<p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">{error}</p>:null}
      <div className="rounded-[26px] border border-black/10 bg-white p-5 sm:p-7">
        <h2 className="mb-4 text-xl font-black">Create a draft banner</h2>
        <BannerForm initial={NEW} busy={busy} save={form=>write("/api/admin-app/banners","POST",payload(form))}/>
      </div>
      <div className="space-y-4">
        <h2 className="text-xl font-black">Saved banners · {rows.length}</h2>
        <p className="text-xs text-black/55">Use Move up / Move down to reorder published and draft banners. Archived banners are excluded. Order changes save immediately.</p>
        {rows.filter(row=>!row.archived).length>100?<p role="alert" className="text-xs font-bold text-red-700">More than 100 active banners: archive older banners before reordering.</p>:null}
        {rows.map(row=>(
          <details key={row.id} className="overflow-hidden rounded-[26px] border border-black/10 bg-white">
            <summary className="flex cursor-pointer flex-wrap items-center gap-4 p-4 sm:p-5">
              <div className="relative h-20 w-32 shrink-0 overflow-hidden rounded-xl bg-black/5">
                <Image src={row.imageUrl} fill alt="" sizes="128px" className="object-cover"/>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-black">{row.title}</h3>
                <p className="mt-1 text-xs text-black/55">{row.ctaText} → {row.ctaHref}</p>
                <p className="mt-1 text-xs text-black/55">
                  {row.archived?"Archived":row.published?"Published":"Draft"} · Order {row.sortOrder}
                </p>
              </div>
              {!row.archived?<span className="flex gap-2">
                <button type="button" aria-label={"Move "+row.title+" up"}
                  disabled={busy||rows.filter(x=>!x.archived).findIndex(x=>x.id===row.id)===0}
                  onClick={event=>{event.preventDefault();event.stopPropagation();void moveBanner(row.id,-1);}}
                  className="rounded-full border border-black/15 px-3 py-2 text-xs font-bold disabled:opacity-35">Move up</button>
                <button type="button" aria-label={"Move "+row.title+" down"}
                  disabled={busy||rows.filter(x=>!x.archived).findIndex(x=>x.id===row.id)>=rows.filter(x=>!x.archived).length-1}
                  onClick={event=>{event.preventDefault();event.stopPropagation();void moveBanner(row.id,1);}}
                  className="rounded-full border border-black/15 px-3 py-2 text-xs font-bold disabled:opacity-35">Move down</button>
              </span>:null}
              <span className="text-xs font-bold text-black/45">Edit / toggle</span>
            </summary>
            <div className="border-t border-black/10 p-4 sm:p-6">
              <BannerForm key={row.updatedAt} initial={toDraft(row)} busy={busy}
                save={form=>write("/api/admin-app/banners/"+encodeURIComponent(row.id),"PATCH",payload(form))}/>
            </div>
          </details>
        ))}
        {loaded && !rows.length?<p className="rounded-2xl bg-white p-5 text-sm text-black/55">No banners yet. The storefront will use the original product hero.</p>:null}
      </div>
    </div>
  );
}
