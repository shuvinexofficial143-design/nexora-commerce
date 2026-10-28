"use client";
import { useState } from "react";
import type { BulkProductAction } from "@/lib/admin/product-bulk";

type Row={id:string;name:string;sku:string;status:string;featured:boolean;updatedAt:string};
type Result={action:BulkProductAction;requested:number;changed:number;unchanged:number};
const actions:{value:BulkProductAction;label:string}[]=[
  {value:"PUBLISH",label:"Publish selected"},
  {value:"MOVE_TO_DRAFT",label:"Move to draft"},
  {value:"FEATURE",label:"Mark featured"},
  {value:"UNFEATURE",label:"Remove featured"},
];
export function BulkProductActions({rows,onComplete}:{rows:Row[];onComplete:()=>void}){
  const [selected,setSelected]=useState<string[]>([]);
  const [action,setAction]=useState<BulkProductAction>("PUBLISH");
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [result,setResult]=useState<Result|null>(null);
  const selectable=rows.filter(row=>row.status!=="ARCHIVED");
  const selectedRows=selectable.filter(row=>selected.includes(row.id)).slice(0,25);
  function choose(id:string,checked:boolean){
    setError("");setResult(null);
    setSelected(old=>{
      const next=old.filter(x=>x!==id);
      return checked&&next.length<25?[...next,id]:next;
    });
  }
  async function apply(){
    if(busy||!selectedRows.length)return;
    setBusy(true);setError("");setResult(null);
    try{
      const response=await fetch("/api/admin-app/products/bulk",{
        method:"POST",cache:"no-store",credentials:"same-origin",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({action,products:selectedRows.map(row=>({
          id:row.id,updatedAt:row.updatedAt,
        }))}),
      });
      const payload=(await response.json().catch(()=>null)) as
        {ok?:boolean;data?:Result;error?:string}|null;
      if(!response.ok||!payload?.ok||!payload.data)
        throw Error(payload?.error??"Bulk update failed.");
      setResult(payload.data);setSelected([]);
      onComplete();
    }catch(e){
      setError(e instanceof Error?e.message:"Bulk update failed.");
    }finally{setBusy(false);}
  }
  return (
    <section className="rounded-[28px] border border-black/10 bg-white p-5 shadow-[0_18px_55px_rgba(17,17,15,.05)] sm:p-6">
      <h2 className="text-xl font-black tracking-tight">Bulk product management</h2>
      <p className="mt-1 text-sm text-black/55">
        Select up to 25 products. Publish validates every required specification and
        category/brand eligibility. An invalid or stale selection cancels the entire batch.
      </p>
      {error?<p role="alert" className="mt-3 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-800">{error}</p>:null}
      {result?<p role="status" className="mt-3 rounded-xl bg-neutral-100 p-3 text-sm font-bold">
        {result.action}: {result.changed} updated, {result.unchanged} already unchanged.
      </p>:null}
      <div className="mt-4 flex flex-wrap items-end gap-3">
        <label className="min-w-[200px] flex-1 text-xs font-black">
          Action
          <select value={action} disabled={busy} onChange={e=>setAction(e.target.value as BulkProductAction)}
            className="mt-1 w-full rounded-xl border border-black/15 bg-white px-3 py-2.5">
            {actions.map(a=><option key={a.value} value={a.value}>{a.label}</option>)}
          </select>
        </label>
        <button type="button" disabled={busy||!selectedRows.length}
          onClick={()=>{void apply();}}
          className="rounded-full bg-black px-5 py-3 text-xs font-black text-white disabled:opacity-40">
          {busy?"Saving…":"Apply to "+selectedRows.length+" selected"}
        </button>
        <button type="button" disabled={busy||!selected.length}
          onClick={()=>setSelected([])}
          className="rounded-full border border-black/15 px-5 py-3 text-xs font-black disabled:opacity-40">
          Clear
        </button>
      </div>
      <div className="mt-4 max-h-56 space-y-1 overflow-y-auto rounded-xl border border-black/10 p-2">
        {selectable.map(row=><label key={row.id}
          className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-xs hover:bg-black/5">
          <input type="checkbox" checked={selectedRows.some(v=>v.id===row.id)}
            disabled={busy||(!selected.includes(row.id)&&selectedRows.length>=25)}
            onChange={e=>choose(row.id,e.target.checked)}
            aria-label={"Select "+row.name}/>
          <span className="min-w-0 flex-1 truncate font-bold">{row.name}</span>
          <span className="shrink-0 text-black/50">{row.sku} · {row.status}</span>
        </label>)}
        {!selectable.length?<p className="p-3 text-sm text-black/50">No editable products on this page.</p>:null}
      </div>
      <p className="mt-2 text-xs text-black/50">
        Showing {rows.length} recently updated products · {selectedRows.length}/25 selected.
        Archived products are excluded. Refresh after another admin changes a product.
      </p>
    </section>
  );
}
