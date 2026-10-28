"use client";
import { useCallback,useEffect,useState } from "react";

type AttributeType="TEXT"|"NUMBER"|"SELECT"|"MULTI_SELECT"|"BOOLEAN"|"COLOR"|"DATE"|"IMAGE_REQUEST";
type Definition={
  id:string;categoryId:string;name:string;slug:string;type:AttributeType;
  required:boolean;active:boolean;sortOrder:number;options:unknown;
};
type Category={id:string;name:string;slug:string};
type Envelope<T>={ok:boolean;error?:string;data?:T};
async function api<T>(method:"GET"|"POST"|"PATCH",payload?:unknown):Promise<T>{
  const response=await fetch("/api/admin-app/catalog/attributes",{
    method,credentials:"same-origin",cache:"no-store",
    ...(payload===undefined?{}:{headers:{"Content-Type":"application/json"},
      body:JSON.stringify(payload)}),
  });
  const result=(await response.json().catch(()=>null)) as Envelope<T>|null;
  if(!response.ok||!result?.ok||result.data===undefined)
    throw Error(result?.error??"Could not load specifications.");
  return result.data;
}
const types:AttributeType[]=[
  "TEXT","NUMBER","SELECT","MULTI_SELECT","BOOLEAN","COLOR","DATE","IMAGE_REQUEST",
];
export function AttributeDefinitionManager({categories}:{categories:Category[]}){
  const [items,setItems]=useState<Definition[]>([]);
  const [form,setForm]=useState({categoryId:"",name:"",type:"TEXT" as AttributeType,
    required:false,options:""});
  const [error,setError]=useState("");
  const [busy,setBusy]=useState(false);
  const refresh=useCallback(async()=>{
    try{setItems(await api<Definition[]>("GET"));setError("");}
    catch(e){setError(e instanceof Error?e.message:"Unable to load attribute definitions.");}
  },[]);
  useEffect(()=>{queueMicrotask(()=>{void refresh();});},[refresh]);
  async function create(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault();setBusy(true);setError("");
    try{
      await api("POST",{...form,
        options:form.options.split(",").map(s=>s.trim()).filter(Boolean)});
      setForm(current=>({...current,name:"",options:""}));
      await refresh();
    }catch(e){setError(e instanceof Error?e.message:"Could not save attribute.");}
    finally{setBusy(false);}
  }
  async function deactivate(item:Definition){
    setBusy(true);setError("");
    try{await api("PATCH",{id:item.id,active:!item.active});await refresh();}
    catch(e){setError(e instanceof Error?e.message:"Could not change attribute state.");}
    finally{setBusy(false);}
  }
  const hasOptions=["SELECT","MULTI_SELECT","COLOR"].includes(form.type);
  return (
    <section className="space-y-4 rounded-[26px] border border-black/10 bg-white p-5 sm:p-7">
      <h2 className="text-xl font-black">Category-specific specifications</h2>
      <p className="text-sm text-black/60">Define real technical details, material and options. Required fields must be provided before publishing a product. Prices and stock remain in SKU variants, not these specification fields.</p>
      {error?<p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>:null}
      <form onSubmit={e=>{void create(e);}} className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-bold">Category
          <select aria-label="Attribute category" value={form.categoryId} required
            onChange={e=>setForm(current=>({...current,categoryId:e.target.value}))}
            className="mt-1 w-full rounded-xl border border-black/15 bg-white px-3 py-3">
            <option value="">Choose category</option>
            {categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <label className="text-xs font-bold">Attribute name
          <input aria-label="Attribute name" required minLength={2} maxLength={80}
            placeholder="Material, RAM, Battery life"
            value={form.name} onChange={e=>setForm(current=>({...current,name:e.target.value}))}
            className="mt-1 w-full rounded-xl border border-black/15 bg-white px-3 py-3"/>
        </label>
        <label className="text-xs font-bold">Type
          <select aria-label="Attribute type" value={form.type}
            onChange={e=>setForm(current=>({...current,type:e.target.value as AttributeType,options:""}))}
            className="mt-1 w-full rounded-xl border border-black/15 bg-white px-3 py-3">
            {types.map(t=><option key={t} value={t}>{t.replaceAll("_"," ")}</option>)}
          </select>
        </label>
        {hasOptions?<label className="text-xs font-bold">Allowed values (comma-separated)
          <input aria-label="Allowed attribute values" value={form.options} required
            onChange={e=>setForm(current=>({...current,options:e.target.value}))}
            placeholder="Black, Blue, Silver"
            className="mt-1 w-full rounded-xl border border-black/15 bg-white px-3 py-3"/>
        </label>:null}
        <label className="flex items-center gap-2 text-xs font-bold">
          <input type="checkbox" checked={form.required}
            onChange={e=>setForm(current=>({...current,required:e.target.checked}))}/>
          Required before product activation
        </label>
        <button disabled={busy||!categories.length} className="rounded-full bg-black px-5 py-3 text-xs font-black text-white disabled:opacity-50">
          Add specification
        </button>
      </form>
      <details className="rounded-xl border border-black/10 p-4">
        <summary className="cursor-pointer text-sm font-black">Saved definitions ({items.length})</summary>
        <div className="mt-3 max-h-80 space-y-2 overflow-y-auto">
          {items.map(item=><div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-black/10 p-3 text-xs">
            <div><b>{item.name}</b> · {item.type} {item.required?"· Required":""}
              <p className="mt-1 text-black/50">{categories.find(c=>c.id===item.categoryId)?.name??"Category"} · {item.slug}</p>
            </div>
            <button type="button" disabled={busy}
              onClick={()=>{void deactivate(item);}}
              className="rounded-full border border-black/15 px-3 py-2 font-black">
              {item.active?"Disable":"Enable"}
            </button>
          </div>)}
        </div>
      </details>
    </section>
  );
}
export function ProductAttributeFields({categoryId,value,onChange}:{
  categoryId:string;value:Record<string,unknown>;
  onChange:(value:Record<string,unknown>)=>void;
}){
  const [definitions,setDefinitions]=useState<Definition[]>([]);
  const [error,setError]=useState("");
  useEffect(()=>{
    if(!categoryId)return;
    let cancelled=false;
    queueMicrotask(()=>{
      void api<Definition[]>("GET").then(rows=>{
        if(!cancelled){setDefinitions(rows.filter(d=>d.categoryId===categoryId&&d.active));setError("");}
      }).catch(e=>{if(!cancelled)setError(e instanceof Error?e.message:"Cannot load attributes.");});
    });
    return ()=>{cancelled=true;};
  },[categoryId]);
  const rows=categoryId?definitions.filter(d=>d.categoryId===categoryId):[];
  function update(key:string,next:unknown){
    onChange({...value,[key]:next});
  }
  if(!categoryId)return <p className="text-xs text-black/60 sm:col-span-2">Choose a category before adding specifications.</p>;
  return <fieldset className="space-y-3 rounded-xl border border-black/10 p-4 sm:col-span-2">
    <legend className="px-1 text-sm font-black">Product specifications</legend>
    {error?<p role="alert" className="text-xs font-bold text-red-700">{error}</p>:null}
    {!rows.length?<p className="text-xs text-black/55">No active specifications for this category. Create them above first.</p>:null}
    {rows.map(item=>{
      const values=Array.isArray(item.options)?item.options.filter((v):v is string=>typeof v==="string"):[];
      const current=value[item.slug];
      return <label key={item.id} className="block text-xs font-bold">
        {item.name} {item.required?"*":""}
        {item.type==="BOOLEAN"?<select value={typeof current==="boolean"?String(current):""}
          onChange={e=>update(item.slug,e.target.value===""?"":e.target.value==="true")}
          className="mt-1 w-full rounded-xl border border-black/15 bg-white px-3 py-2.5">
          <option value="">Not specified</option><option value="true">Yes</option><option value="false">No</option>
        </select>:item.type==="SELECT"||item.type==="COLOR"?
        <select value={typeof current==="string"?current:""}
          onChange={e=>update(item.slug,e.target.value)}
          className="mt-1 w-full rounded-xl border border-black/15 bg-white px-3 py-2.5">
          <option value="">Not specified</option>
          {values.map(v=><option key={v} value={v}>{v}</option>)}
        </select>:item.type==="MULTI_SELECT"?
        <select multiple value={Array.isArray(current)?current as string[]:[]}
          onChange={e=>update(item.slug,Array.from(e.target.selectedOptions,x=>x.value))}
          className="mt-1 w-full rounded-xl border border-black/15 bg-white px-3 py-2.5">
          {values.map(v=><option key={v} value={v}>{v}</option>)}
        </select>:
        <input type={item.type==="NUMBER"?"number":item.type==="DATE"?"date":"text"}
          value={typeof current==="string"||typeof current==="number"?String(current):""}
          placeholder={item.type==="IMAGE_REQUEST"?"Approved HTTPS image URL":undefined}
          onChange={e=>update(item.slug,item.type==="NUMBER"
            ?e.target.value===""?"":Number(e.target.value):e.target.value)}
          className="mt-1 w-full rounded-xl border border-black/15 bg-white px-3 py-2.5"/>}
      </label>;
    })}
  </fieldset>;
}