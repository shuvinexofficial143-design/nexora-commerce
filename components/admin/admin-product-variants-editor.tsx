"use client";
import { useEffect, useState } from "react";
import type { ProductChoiceGroup } from "@/lib/commerce/product-choices";

type Product = { id: string; name: string; sku: string };
type VariantRow = { id: string; sku: string; choices: Record<string,string>;
  priceMinor: number; onHand: number; reserved: number; active: boolean };
type Draft = { price: string; stock: string; active: boolean };
type Envelope<T> = { ok: boolean; data?: T; error?: string };

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, cache: "no-store",
    headers: { ...(init?.body ? { "Content-Type": "application/json" } : {}), ...init?.headers } });
  const result = await response.json() as Envelope<T>;
  if (!response.ok || !result.ok) throw new Error(result.error || "Variant request failed.");
  return result.data as T;
}

export function AdminProductVariantsEditor({ products }: { products: Product[] }) {
  const [productId, setProductId] = useState("");
  const [groups, setGroups] = useState<ProductChoiceGroup[]>([]);
  const [variants, setVariants] = useState<VariantRow[]>([]);
  const [selected, setSelected] = useState<Record<string,string>>({});
  const [sku, setSku] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("0");
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const base = productId ? "/api/admin-app/products/" + encodeURIComponent(productId) : "";
  async function refresh(id: string) {
    const path = "/api/admin-app/products/" + encodeURIComponent(id);
    const [choiceGroups, rows] = await Promise.all([
      request<ProductChoiceGroup[]>(path + "/choices"),
      request<VariantRow[]>(path + "/variants"),
    ]);
    setGroups(choiceGroups); setVariants(rows);
    setDrafts(Object.fromEntries(rows.map(row => [row.id, {
      price: String(row.priceMinor / 100), stock: String(row.onHand), active: row.active,
    }])));
  }
  useEffect(() => {
    if (!productId) return;
    let active = true;
    const path = "/api/admin-app/products/" + encodeURIComponent(productId);
    void Promise.all([
      request<ProductChoiceGroup[]>(path + "/choices"),
      request<VariantRow[]>(path + "/variants"),
    ]).then(([choices, rows]) => {
      if (!active) return;
      setGroups(choices); setVariants(rows);
      setDrafts(Object.fromEntries(rows.map(row => [row.id, {
        price: String(row.priceMinor / 100), stock: String(row.onHand), active: row.active,
      }])));
    }).catch(e => { if (active) setMessage(e instanceof Error ? e.message : "Could not load variants."); });
    return () => { active = false; };
  }, [productId]);

  async function create() {
    if (!productId || busy) return;
    setBusy(true); setMessage("");
    try {
      await request(base + "/variants", { method: "POST", body: JSON.stringify({
        sku: sku.trim(), choices: selected, priceMinor: Math.round(Number(price) * 100),
        onHand: Number(stock), active: true,
      }) });
      setSku(""); setPrice(""); setStock("0"); setSelected({});
      await refresh(productId);
      setMessage("SKU variant created. Pricing and stock are now enforced by checkout.");
    } catch (e) { setMessage(e instanceof Error ? e.message : "Unable to create SKU."); }
    finally { setBusy(false); }
  }
  async function save(row: VariantRow) {
    const current = drafts[row.id];
    if (!current || busy) return;
    setBusy(true); setMessage("");
    try {
      await request(base + "/variants", { method: "PATCH", body: JSON.stringify({
        id: row.id, priceMinor: Math.round(Number(current.price) * 100),
        onHand: Number(current.stock), active: current.active,
      }) });
      await refresh(productId);
      setMessage("Variant updated. A stock quantity below reserved units is not permitted.");
    } catch (e) { setMessage(e instanceof Error ? e.message : "Unable to save SKU."); }
    finally { setBusy(false); }
  }
  const edit = (id: string, patch: Partial<Draft>) =>
    setDrafts(all => ({ ...all, [id]: { ...all[id], ...patch } }));

  return <section className="rounded-[28px] border border-black/10 bg-white p-5 sm:p-6">
    <h2 className="text-xl font-black">Variant SKU, price and inventory</h2>
    <p className="mt-2 text-sm text-black/60">
      Assign independent prices and stock to exact option combinations.
      Product option groups must be saved first. Reserved inventory cannot be reduced.
    </p>
    <label className="mt-4 block text-sm font-bold">Product
      <select className="mt-2 w-full rounded-xl border border-black/20 p-3" value={productId}
        onChange={e => { setProductId(e.target.value); setGroups([]); setVariants([]); setSelected({}); setMessage(""); }}>
        <option value="">Choose product</option>
        {products.map(p => <option key={p.id} value={p.id}>{p.name} · {p.sku}</option>)}
      </select>
    </label>
    {productId && <div className="mt-5 space-y-5">
      {!groups.length ? <p className="text-sm text-black/55">First save product option groups above, then choose this product again.</p> :
        <div className="rounded-xl bg-[#fafaf7] p-4">
          <h3 className="text-sm font-black">New SKU variant</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {groups.map(group => <label className="text-xs font-bold" key={group.key}>{group.label}{group.required ? " *" : ""}
              <select value={selected[group.key] ?? ""} className="mt-1 w-full rounded-lg border p-2.5"
                onChange={e => setSelected(prev => {
                  const result = { ...prev };
                  if (e.target.value) result[group.key] = e.target.value;
                  else delete result[group.key];
                  return result;
                })}>
                <option value="">Select {group.label}</option>
                {group.values.filter(v => v.available).map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
              </select>
            </label>)}
            <label className="text-xs font-bold">Unique SKU
              <input className="mt-1 w-full rounded-lg border p-2.5" value={sku} onChange={e => setSku(e.target.value)} placeholder="NX-TEE-BLACK-M" />
            </label>
            <label className="text-xs font-bold">Price (₹)
              <input type="number" min="0" step="0.01" className="mt-1 w-full rounded-lg border p-2.5" value={price} onChange={e => setPrice(e.target.value)} />
            </label>
            <label className="text-xs font-bold">Stock available to reserve (units)
              <input type="number" min="0" step="1" className="mt-1 w-full rounded-lg border p-2.5" value={stock} onChange={e => setStock(e.target.value)} />
            </label>
          </div>
          <button type="button" disabled={busy} onClick={() => void create()}
            className="mt-4 rounded-full bg-black px-5 py-3 text-xs font-black text-white disabled:opacity-50">Create variant SKU</button>
        </div>}
      <div className="space-y-3">
        {variants.map(row => <div key={row.id} className="rounded-xl border border-black/10 p-4">
          <div className="flex flex-wrap justify-between gap-2 text-sm font-black">
            <span>{row.sku}</span><span>{Object.entries(row.choices).map(([k,v]) => k + ": " + v).join(" · ")}</span>
          </div>
          <p className="mt-1 text-xs text-black/55">Reserved: {row.reserved} · Currently available: {Math.max(0, row.onHand-row.reserved)}</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-end">
            <label className="text-xs font-bold">Price ₹
              <input type="number" step="0.01" min="0" value={drafts[row.id]?.price ?? ""}
                onChange={e => edit(row.id, { price: e.target.value })} className="mt-1 w-full rounded-lg border p-2" />
            </label>
            <label className="text-xs font-bold">Total on hand
              <input type="number" step="1" min={row.reserved} value={drafts[row.id]?.stock ?? ""}
                onChange={e => edit(row.id, { stock: e.target.value })} className="mt-1 w-full rounded-lg border p-2" />
            </label>
            <label className="flex items-center gap-1.5 text-xs font-bold">
              <input type="checkbox" checked={drafts[row.id]?.active ?? row.active}
                onChange={e => edit(row.id, { active: e.target.checked })} /> Active
            </label>
            <button type="button" disabled={busy} onClick={() => void save(row)}
              className="rounded-full bg-[#d7ff47] px-4 py-2.5 text-xs font-black disabled:opacity-50">Save SKU</button>
          </div>
        </div>)}
      </div>
      <p role="status" className="text-sm font-bold text-black/65">{message}</p>
    </div>}
  </section>;
}
