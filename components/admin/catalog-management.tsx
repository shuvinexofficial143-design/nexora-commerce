"use client";

import { useCallback, useEffect, useState } from "react";

type Category = { id: string; name: string; slug: string; parent?: { name: string } | null; archived: boolean; _count: { products: number; children: number } };
type Brand = { id: string; name: string; slug: string; active: boolean; featured: boolean; _count: { products: number } };
type Attribute = { id: string; categoryId: string; name: string; slug: string; type: string; required: boolean; active: boolean; options: unknown };

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, credentials: "same-origin", headers: { ...(init?.body ? { "Content-Type": "application/json" } : {}) } });
  const payload = await response.json().catch(() => null) as { ok?: boolean; data?: T; error?: string } | null;
  if (!response.ok || !payload?.ok) throw new Error(payload?.error || "Catalog request failed.");
  return payload.data as T;
}

const inputClass = "w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm font-bold outline-none focus:border-black";
const buttonClass = "rounded-xl bg-black px-4 py-2.5 text-xs font-black text-white hover:bg-black/80";

export function CatalogManagement() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [categoryForm, setCategoryForm] = useState({ name: "", slug: "", parentId: "" });
  const [brandForm, setBrandForm] = useState({ name: "", slug: "", featured: false });
  const [attributeForm, setAttributeForm] = useState({ categoryId: "", name: "", type: "TEXT", options: "", required: false });
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    try {
      const [nextCategories, nextBrands, nextAttributes] = await Promise.all([
        request<Category[]>("/api/admin-app/catalog/categories?archived=true"),
        request<Brand[]>("/api/admin-app/catalog/brands?inactive=true"),
        request<Attribute[]>("/api/admin-app/catalog/attributes"),
      ]);
      setCategories(nextCategories); setBrands(nextBrands); setAttributes(nextAttributes);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not load catalog management."); }
  }, []);
  useEffect(() => { const timer = window.setTimeout(() => { void load(); }, 0); return () => window.clearTimeout(timer); }, [load]);

  async function create(url: string, body: unknown) {
    setError(""); setNotice("");
    try { await request(url, { method: "POST", body: JSON.stringify(body) }); setNotice("Saved successfully."); await load(); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Could not save."); }
  }

  async function archive(url: string) {
    setError("");
    try { await request(url, { method: "DELETE" }); setNotice("Archived."); await load(); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Could not archive."); }
  }

  return <div className="space-y-6">
    <div><p className="text-xs font-black uppercase tracking-[.18em] text-black/35">Catalog structure</p><h1 className="mt-1 text-3xl font-black tracking-[-.05em]">Categories, brands & attributes</h1><p className="mt-2 max-w-2xl text-sm font-medium text-black/50">Manage storefront taxonomy and category-specific product data. Product counts are live and archive actions are reversible at the database level.</p></div>
    {error ? <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-800">{error}</div> : null}
    {notice ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-800">{notice}</div> : null}
    <section className="grid gap-6 xl:grid-cols-2">
      <div className="rounded-[28px] border border-black/10 bg-white p-5 shadow-[0_18px_55px_rgba(17,17,15,.05)]"><h2 className="text-xl font-black">Categories</h2><form className="mt-4 grid gap-2 sm:grid-cols-3" onSubmit={(event) => { event.preventDefault(); void create("/api/admin-app/catalog/categories", categoryForm); }}><input className={inputClass} placeholder="Name" value={categoryForm.name} onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })} required /><input className={inputClass} placeholder="Slug (optional)" value={categoryForm.slug} onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })} /><select className={inputClass} value={categoryForm.parentId} onChange={(e) => setCategoryForm({ ...categoryForm, parentId: e.target.value })}><option value="">Top-level</option>{categories.filter((item) => !item.parent && !item.archived).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><button className={`${buttonClass} sm:col-span-3`}>Add category</button></form><div className="mt-5 divide-y divide-black/8">{categories.map((item) => <div className="flex items-center justify-between gap-3 py-3" key={item.id}><div><p className="font-black">{item.parent ? "↳ " : ""}{item.name}</p><p className="text-xs font-bold text-black/40">{item.slug} · {item._count.products} products · {item.archived ? "Archived" : "Active"}</p></div>{!item.archived ? <button className="text-xs font-black text-red-700 underline" onClick={() => void archive(`/api/admin-app/catalog/categories/${item.id}`)}>Archive</button> : null}</div>)}</div></div>
      <div className="rounded-[28px] border border-black/10 bg-white p-5 shadow-[0_18px_55px_rgba(17,17,15,.05)]"><h2 className="text-xl font-black">Brands</h2><form className="mt-4 grid gap-2 sm:grid-cols-2" onSubmit={(event) => { event.preventDefault(); void create("/api/admin-app/catalog/brands", brandForm); }}><input className={inputClass} placeholder="Name" value={brandForm.name} onChange={(e) => setBrandForm({ ...brandForm, name: e.target.value })} required /><input className={inputClass} placeholder="Slug (optional)" value={brandForm.slug} onChange={(e) => setBrandForm({ ...brandForm, slug: e.target.value })} /><label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={brandForm.featured} onChange={(e) => setBrandForm({ ...brandForm, featured: e.target.checked })} /> Featured brand</label><button className={`${buttonClass} sm:col-span-2`}>Add brand</button></form><div className="mt-5 divide-y divide-black/8">{brands.map((item) => <div className="flex items-center justify-between gap-3 py-3" key={item.id}><div><p className="font-black">{item.name}{item.featured ? " · Featured" : ""}</p><p className="text-xs font-bold text-black/40">{item.slug} · {item._count.products} products · {item.active ? "Active" : "Inactive"}</p></div>{item.active ? <button className="text-xs font-black text-red-700 underline" onClick={() => void archive(`/api/admin-app/catalog/brands/${item.id}`)}>Archive</button> : null}</div>)}</div></div>
    </section>
    <section className="rounded-[28px] border border-black/10 bg-white p-5 shadow-[0_18px_55px_rgba(17,17,15,.05)]"><h2 className="text-xl font-black">Universal attributes</h2><p className="mt-1 text-sm font-medium text-black/45">Definitions are scoped to a category and enforced on product create/update.</p><form className="mt-4 grid gap-2 md:grid-cols-5" onSubmit={(event) => { event.preventDefault(); void create("/api/admin-app/catalog/attributes", { ...attributeForm, options: attributeForm.options.split(",").map((value) => value.trim()).filter(Boolean) }); }}><select className={inputClass} value={attributeForm.categoryId} onChange={(e) => setAttributeForm({ ...attributeForm, categoryId: e.target.value })} required><option value="">Category</option>{categories.filter((item) => !item.archived).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><input className={inputClass} placeholder="Attribute name" value={attributeForm.name} onChange={(e) => setAttributeForm({ ...attributeForm, name: e.target.value })} required /><select className={inputClass} value={attributeForm.type} onChange={(e) => setAttributeForm({ ...attributeForm, type: e.target.value })}><option>TEXT</option><option>NUMBER</option><option>SELECT</option><option>MULTI_SELECT</option><option>BOOLEAN</option><option>COLOR</option><option>DATE</option></select><input className={inputClass} placeholder="Options, comma-separated" value={attributeForm.options} onChange={(e) => setAttributeForm({ ...attributeForm, options: e.target.value })} /><button className={buttonClass}>Add attribute</button></form><div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{attributes.filter((item) => item.active).map((item) => <div className="rounded-2xl bg-[#f5f5f1] p-4" key={item.id}><p className="font-black">{item.name}{item.required ? " · Required" : ""}</p><p className="mt-1 text-xs font-bold text-black/45">{item.type} · {item.slug}</p></div>)}</div></section>
  </div>;
}