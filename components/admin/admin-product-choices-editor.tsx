"use client";

import { useEffect, useState } from "react";
import type { ProductChoiceGroup, ProductChoiceValue } from "@/lib/commerce/product-choices";

type Product = { id: string; name: string; sku: string };
type FormGroup = Omit<ProductChoiceGroup, "values"> & { values: ProductChoiceValue[] };
const keyOf = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);

export function AdminProductChoicesEditor({ products }: { products: Product[] }) {
  const [id, setId] = useState("");
  const [groups, setGroups] = useState<FormGroup[]>([]);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!id) return;
    let alive = true;
    fetch(`/api/admin-app/products/${encodeURIComponent(id)}/choices`, { cache: "no-store" })
      .then(async r => {
        const body = await r.json() as { ok: boolean; data?: FormGroup[]; error?: string };
        if (!r.ok || !body.ok) throw new Error(body.error || "Unable to load product options.");
        return body.data ?? [];
      })
      .then(result => { if (alive) { setGroups(result); setStatus(""); } })
      .catch(error => { if (alive) { setGroups([]); setStatus(String(error)); } });
    return () => { alive = false; };
  }, [id]);

  const updateGroup = (idx: number, patch: Partial<FormGroup>) => setGroups(prev =>
    prev.map((entry, index) => index === idx ? { ...entry, ...patch } : entry));
  const updateValue = (idx: number, vi: number, patch: Partial<ProductChoiceValue>) => setGroups(prev =>
    prev.map((entry, gi) => gi === idx ? {
      ...entry, values: entry.values.map((v, ii) => ii === vi ? { ...v, ...patch } : v),
    } : entry));

  async function save() {
    if (!id || busy) return;
    setBusy(true); setStatus("");
    try {
      const payload = groups.map((group, i) => ({
        key: group.key.trim().toLowerCase(), label: group.label.trim(),
        required: group.required, sortOrder: i,
        values: group.values.map(v => ({ value: v.value.trim().toLowerCase(), label: v.label.trim(), available: v.available })),
      }));
      const r = await fetch(`/api/admin-app/products/${encodeURIComponent(id)}/choices`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groups: payload }),
      });
      const result = await r.json() as { ok: boolean; data?: ProductChoiceGroup[]; error?: string };
      if (!r.ok || !result.ok) throw new Error(result.error || "Unable to save options.");
      setGroups(result.data ?? []);
      setStatus("Saved. Customers will now see these options on the product page.");
    } catch (err) { setStatus(err instanceof Error ? err.message : "Could not save options."); }
    finally { setBusy(false); }
  }

  return <section className="rounded-[28px] border border-black/10 bg-white p-5 sm:p-6">
    <h2 className="text-xl font-black">Product options · Admin controlled</h2>
    <p className="mt-1 text-sm text-black/55">Create selectable Colour, Size, Material, Pack, or other product options. These selections do not change individual inventory or selling price.</p>
    <label className="mt-5 block text-xs font-black uppercase tracking-wide text-black/50">Choose product
      <select value={id} onChange={e => { setId(e.target.value); setGroups([]); setStatus(e.target.value ? "Loading saved options…" : ""); }}
        className="mt-2 w-full rounded-xl border border-black/20 bg-white p-3 text-sm">
        <option value="">Select a product</option>
        {products.map(p => <option key={p.id} value={p.id}>{p.name} · {p.sku}</option>)}
      </select>
    </label>
    {id && <div className="mt-5 space-y-4">
      {groups.map((group, index) => <fieldset key={index} className="rounded-2xl border border-black/10 bg-[#fafaf7] p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-black">Option Key (e.g. colour)
            <input value={group.key} onChange={e => updateGroup(index, { key: e.target.value })}
              className="mt-1 w-full rounded-lg border p-2.5 text-sm" />
          </label>
          <label className="text-xs font-black">Customer-facing label
            <input value={group.label} onChange={e => updateGroup(index, { label: e.target.value })}
              className="mt-1 w-full rounded-lg border p-2.5 text-sm" />
          </label>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-xs font-black">
            <input type="checkbox" checked={group.required} onChange={e => updateGroup(index, { required: e.target.checked })} />
            Customer must choose
          </label>
          <button type="button" className="text-xs font-black text-red-700" onClick={() => setGroups(current => current.filter((_, i) => i !== index))}>Remove group</button>
        </div>
        <div className="mt-4 space-y-2">
          {group.values.map((v, vi) => <div key={vi} className="grid grid-cols-[1fr_1fr_auto_auto] gap-2">
            <input aria-label="Option value identifier" placeholder="black" value={v.value}
              onChange={e => updateValue(index, vi, { value: keyOf(e.target.value) })}
              className="min-w-0 rounded-lg border p-2 text-xs" />
            <input aria-label="Option customer label" placeholder="Black" value={v.label}
              onChange={e => updateValue(index, vi, { label: e.target.value })}
              className="min-w-0 rounded-lg border p-2 text-xs" />
            <label className="flex items-center gap-1 text-[10px] font-black">
              <input type="checkbox" checked={v.available} onChange={e => updateValue(index, vi, { available: e.target.checked })} /> Active
            </label>
            <button type="button" aria-label="Remove choice" onClick={() => updateGroup(index, { values: group.values.filter((_, i) => i !== vi) })}
              className="text-xs font-black text-red-700">×</button>
          </div>)}
          <button type="button" className="rounded-full border px-3 py-2 text-xs font-black"
            disabled={group.values.length >= 20}
            onClick={() => updateGroup(index, { values: [...group.values, { value: "", label: "", available: true }] })}>+ Add value</button>
        </div>
      </fieldset>)}
      <div className="flex flex-wrap gap-3">
        <button type="button" className="rounded-full border border-black/20 px-5 py-3 text-xs font-black"
          disabled={groups.length >= 8}
          onClick={() => setGroups(current => [...current, {
            key: "", label: "", required: true, sortOrder: current.length,
            values: [{ value: "", label: "", available: true }],
          }])}>+ Add option group</button>
        <button type="button" disabled={busy} onClick={() => void save()}
          className="rounded-full bg-black px-6 py-3 text-xs font-black text-white disabled:opacity-40">
          {busy ? "Saving…" : "Save product options"}
        </button>
      </div>
      <p role="status" className="text-sm font-bold text-black/60">{status}</p>
    </div>}
  </section>;
}
