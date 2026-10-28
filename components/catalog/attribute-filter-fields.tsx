"use client";
import { useState } from "react";
import type { AttributeFilter,PublicAttributeFacet } from "@/lib/storefront/attribute-filters";
import { formatAttributeFilter } from "@/lib/storefront/attribute-filters";

export function AttributeFilterFields({facets,initial,categories}:{
  facets:PublicAttributeFacet[];
  initial:AttributeFilter[];
  categories:string[];
}){
  const [values,setValues]=useState<Record<string,string[]>>(()=>{
    const out:Record<string,string[]>={};
    for(const group of initial)out[group.category+"."+group.slug]=[...group.values];
    return out;
  });
  const visible=categories.length ? facets.filter(f=>categories.includes(f.category)) : facets;
  function update(facet:PublicAttributeFacet,valuesNext:string[]){
    const key=facet.category+"."+facet.slug;
    setValues(old=>({...old,[key]:valuesNext}));
  }
  if(!visible.length)return null;
  return <fieldset className="space-y-4 border-t border-black/10 pt-5">
    <legend className="text-xs font-black uppercase tracking-wide text-black/60">
      Product specifications
    </legend>
    <p className="text-xs text-black/50">Exact specification matches from published product definitions. Choose a category to narrow the options.</p>
    {visible.map(f=>{
      const key=f.category+"."+f.slug;
      const chosen=values[key]??[];
      const selectable=["SELECT","COLOR","MULTI_SELECT","BOOLEAN"].includes(f.type);
      return <div key={key} className="space-y-2">
        <label className="block text-xs font-black">
          {f.label} <span className="font-normal text-black/45">({f.category})</span>
        </label>
        {selectable ?
          <div className="max-h-32 space-y-2 overflow-y-auto">
            {f.options.map(option=><label key={option} className="flex items-center gap-2 text-xs">
              <input type="checkbox" checked={chosen.includes(option)}
                onChange={event=>update(f,event.target.checked?[...chosen,option]:chosen.filter(x=>x!==option))}
                className="accent-black"/>
              {f.type==="BOOLEAN"?(option==="true"?"Yes":"No"):option}
            </label>)}
          </div>
        : <input type={f.type==="NUMBER"?"number":"text"}
            inputMode={f.type==="NUMBER"?"decimal":"text"}
            maxLength={80} value={chosen[0]??""}
            onChange={e=>update(f,e.target.value?[e.target.value]:[])}
            placeholder={f.type==="NUMBER"?"Exact number":"Exact text"}
            className="w-full rounded-xl border border-black/15 bg-white px-3 py-2.5 text-sm"/>}
        {chosen.filter(v=>v.length>0&&v.length<=80).map(v=>
          <input type="hidden" name="attr" key={v} value={formatAttributeFilter({
            category:f.category,slug:f.slug,values:[v],
          },v)}/>)}
      </div>;
    })}
  </fieldset>;
}
