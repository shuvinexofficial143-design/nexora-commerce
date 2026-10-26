"use client";
import type { ProductChoiceGroup } from "@/lib/commerce/product-choices";

export function ProductChoicePicker({groups, selected, onChange}:{
  groups: ProductChoiceGroup[];
  selected: Record<string,string>;
  onChange: (next: Record<string,string>) => void;
}) {
  return <div className="space-y-4" aria-label="Product options">
    {groups.map(group => <fieldset key={group.key} className="space-y-2">
      <legend className="text-sm font-black">{group.label}
        {group.required && <span className="ml-1 text-red-700">*</span>}
      </legend>
      <div className="flex flex-wrap gap-2">
        {group.values.map(v => <button type="button" key={v.value}
          aria-pressed={selected[group.key] === v.value}
          disabled={!v.available}
          onClick={() => {
            const next = { ...selected };
            if (selected[group.key] === v.value && !group.required) delete next[group.key];
            else next[group.key] = v.value;
            onChange(next);
          }}
          className={`rounded-full border px-4 py-2 text-xs font-black transition disabled:cursor-not-allowed disabled:opacity-35 ${selected[group.key] === v.value ? "border-black bg-black text-white" : "border-black/15 bg-white"}`}>
          {v.label}{!v.available ? " — unavailable" : ""}
        </button>)}
      </div>
    </fieldset>)}
    <p className="text-xs text-black/50">Options shown are configured by the store. They do not change price or individual stock unless separately verified.</p>
  </div>;
}
