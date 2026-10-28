"use client";
import { useCallback, useEffect, useState } from "react";

type Category = {
  id:string;slug:string;name:string;parentId:string|null;
  visible:boolean;archived:boolean;sortOrder:number;
};
type Brand={id:string;slug:string;name:string;active:boolean;featured:boolean};
type Catalog={categories:Category[];brands:Brand[]};
type Response<T>={ok:boolean;data?:T;error?:string};

async function request<T>(method:"GET"|"PATCH",value?:unknown):Promise<T>{
  const response=await fetch("/api/admin-app/product-taxonomy",{
    method,credentials:"same-origin",cache:"no-store",
    ...(value===undefined?{}:{headers:{"Content-Type":"application/json"},
      body:JSON.stringify(value)}),
  });
  const payload=(await response.json().catch(()=>null)) as Response<T>|null;
  if(!response.ok||!payload?.ok||payload.data===undefined)
    throw new Error(payload?.error??"Could not update catalog settings.");
  return payload.data;
}
export function CatalogVisibilityControls({onChanged}:{onChanged:()=>void}){
  const [data,setData]=useState<Catalog>({categories:[],brands:[]});
  const [error,setError]=useState("");
  const [busy,setBusy]=useState<string|null>(null);
  const load=useCallback(async()=>{
    try{setData(await request<Catalog>("GET"));setError("");}
    catch(error){setError(error instanceof Error?error.message:"Catalog settings unavailable.");}
  },[]);
  useEffect(()=>{queueMicrotask(()=>{void load();});},[load]);
  async function save(kind:"category"|"brand",slug:string,changes:Record<string,unknown>){
    setBusy(kind+slug);setError("");
    try{
      await request("PATCH",{kind,slug,...changes});
      await load();onChanged();
    }catch(error){setError(error instanceof Error?error.message:"Could not update catalog.");}
    finally{setBusy(null);}
  }
  return (
    <section className="space-y-4 rounded-[26px] border border-black/10 bg-white p-5 sm:p-7">
      <header>
        <h2 className="text-xl font-black">Catalog visibility and hierarchy</h2>
        <p className="mt-2 text-xs leading-5 text-black/60">
          A hidden or archived category, including its descendants, is removed from the public
          Shop, Search, Product pages and new Checkout orders. Inactive brands are hidden too.
          Previously placed orders remain accessible.
        </p>
      </header>
      {error?<p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-bold text-red-800">{error}</p>:null}
      <details className="rounded-xl border border-black/10 p-4">
        <summary className="cursor-pointer font-black">Manage categories ({data.categories.length})</summary>
        <div className="mt-4 max-h-[450px] space-y-3 overflow-y-auto">
          {data.categories.map(cat=><div key={cat.id} className="grid gap-2 rounded-xl border border-black/10 p-3 sm:grid-cols-[minmax(100px,1fr)_auto_auto] sm:items-center">
            <div>
              <p className="text-sm font-bold">{cat.name}</p>
              <p className="text-xs text-black/50">{cat.slug}</p>
            </div>
            <label className="flex items-center gap-2 text-xs font-bold">
              <input type="checkbox" disabled={busy!==null} checked={cat.visible}
                onChange={e=>void save("category",cat.slug,{visible:e.target.checked})}/> Visible
            </label>
            <label className="flex items-center gap-2 text-xs font-bold">
              <input type="checkbox" disabled={busy!==null} checked={cat.archived}
                onChange={e=>void save("category",cat.slug,{archived:e.target.checked})}/> Archived
            </label>
            <label className="flex flex-col gap-1 text-xs font-bold sm:col-span-2">
              Parent category
              <select disabled={busy!==null} value={data.categories.find(x=>x.id===cat.parentId)?.slug??""}
                onChange={e=>void save("category",cat.slug,{parentSlug:e.target.value||null})}
                className="w-full rounded-lg border border-black/15 bg-white px-3 py-2">
                <option value="">Top level</option>
                {data.categories.filter(x=>x.id!==cat.id).map(x=><option key={x.id} value={x.slug}>{x.name}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs font-bold">
              Display order
              <input type="number" min={0} max={1000} disabled={busy!==null}
                value={cat.sortOrder}
                onChange={e=>setData(current=>({...current,categories:current.categories.map(x=>
                  x.id===cat.id?{...x,sortOrder:Number(e.target.value)}:x)}))}
                onBlur={()=>void save("category",cat.slug,{sortOrder:cat.sortOrder})}
                className="w-28 rounded-lg border border-black/15 px-3 py-2"/>
            </label>
          </div>)}
          {!data.categories.length?<p className="text-sm text-black/50">Create a category above first.</p>:null}
        </div>
      </details>
      <details className="rounded-xl border border-black/10 p-4">
        <summary className="cursor-pointer font-black">Manage brands ({data.brands.length})</summary>
        <div className="mt-4 max-h-[450px] space-y-3 overflow-y-auto">
          {data.brands.map(brand=><div key={brand.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-black/10 p-3">
            <p className="text-sm font-black">{brand.name} <span className="text-xs font-normal text-black/50">({brand.slug})</span></p>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-xs font-bold">
                <input type="checkbox" disabled={busy!==null} checked={brand.active}
                  onChange={e=>void save("brand",brand.slug,{active:e.target.checked})}/> Active
              </label>
              <label className="flex items-center gap-2 text-xs font-bold">
                <input type="checkbox" disabled={busy!==null} checked={brand.featured}
                  onChange={e=>void save("brand",brand.slug,{featured:e.target.checked})}/> Featured
              </label>
            </div>
          </div>)}
          {!data.brands.length?<p className="text-sm text-black/50">Create a brand above first.</p>:null}
        </div>
      </details>
    </section>
  );
}