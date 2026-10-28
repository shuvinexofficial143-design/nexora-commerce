"use client";

import type { ProductAttributeDefinition } from "@/lib/admin/attribute-input";
import { attributeOptions } from "@/lib/admin/attribute-input";

type Props = {
  definitions: ProductAttributeDefinition[];
  value: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
  disabled?: boolean;
  loading?: boolean;
  error?: string;
};

const fieldClass = "w-full rounded-xl border border-black/15 bg-white px-3 py-2.5 text-sm font-bold outline-none focus:border-black disabled:opacity-50";

export function ProductAttributeEditor({ definitions, value, onChange, disabled, loading, error }: Props) {
  function set(slug: string, next: unknown) {
    onChange({ ...value, [slug]: next });
  }

  return <fieldset disabled={disabled || loading || Boolean(error)} className="space-y-3 rounded-2xl border border-black/10 bg-[#fafaf7] p-4 md:col-span-2">
    <legend className="px-2 text-sm font-black">Category-specific product attributes</legend>
    {loading ? <p role="status" className="text-sm text-black/50">Loading category attributes…</p> : null}
    {error ? <p role="alert" className="text-sm font-bold text-red-700">{error}</p> : null}
    {!loading && !error && definitions.length === 0 ? <p className="text-sm text-black/45">No active attributes for this category.</p> : null}
    <div className="grid gap-3 sm:grid-cols-2">
      {definitions.map((definition) => {
        const selected = value[definition.slug];
        const options = attributeOptions(definition);
        const label = <span className="mb-1.5 block text-xs font-black text-black/65">{definition.name}{definition.required ? " *" : ""}</span>;
        if (definition.type === "MULTI_SELECT") {
          const checked = Array.isArray(selected) ? selected as string[] : [];
          return <div key={definition.id} className="rounded-xl border border-black/10 p-3">
            <p className="text-xs font-black">{definition.name}{definition.required ? " *" : ""}</p>
            <div className="mt-2 flex flex-wrap gap-3">{options.map((item) => <label key={item} className="flex items-center gap-1.5 text-xs font-semibold"><input type="checkbox" checked={checked.includes(item)} onChange={(event) => set(definition.slug, event.target.checked ? [...checked, item] : checked.filter((old) => old !== item))} />{item}</label>)}</div>
          </div>;
        }
        if (definition.type === "BOOLEAN") {
          return <label key={definition.id}>{label}<select className={fieldClass} required={definition.required} value={typeof selected === "boolean" ? String(selected) : ""} onChange={(event) => set(definition.slug, event.target.value === "" ? undefined : event.target.value === "true")}>
            <option value="">Not specified</option><option value="true">Yes</option><option value="false">No</option>
          </select></label>;
        }
        if (["SELECT", "COLOR"].includes(definition.type)) {
          return <label key={definition.id}>{label}<select className={fieldClass} required={definition.required} value={typeof selected === "string" ? selected : ""} onChange={(event) => set(definition.slug, event.target.value)}>
            <option value="">Select {definition.name.toLowerCase()}</option>
            {options.map((item) => <option key={item} value={item}>{item}</option>)}
          </select></label>;
        }
        if (definition.type === "IMAGE_REQUEST") {
          return <label key={definition.id} className="sm:col-span-2">{label}<textarea className={fieldClass} rows={2} maxLength={2000} required={definition.required} value={typeof selected === "string" ? selected : ""} onChange={(event) => set(definition.slug, event.target.value)} placeholder="Customer photo or customization instructions (request only; not an upload)" /></label>;
        }
        return <label key={definition.id}>{label}<input className={fieldClass}
          type={definition.type === "NUMBER" ? "number" : definition.type === "DATE" ? "date" : "text"}
          step={definition.type === "NUMBER" ? "any" : undefined}
          maxLength={definition.type === "TEXT" ? 2000 : undefined}
          required={definition.required}
          value={typeof selected === "string" || typeof selected === "number" ? String(selected) : ""}
          onChange={(event) => set(definition.slug, event.target.value)}
        /></label>;
      })}
    </div>
    {definitions.length > 0 ? <p className="text-xs text-black/45">Fields and allowed values come from the selected category. Starred fields are required.</p> : null}
  </fieldset>;
}
