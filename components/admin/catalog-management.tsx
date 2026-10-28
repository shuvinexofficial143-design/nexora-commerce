"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Category = {
  id: string; name: string; slug: string; description: string | null; imageUrl: string | null;
  sortOrder: number; visible: boolean; archived: boolean; parentId: string | null;
  parent?: { name: string } | null; _count: { products: number; children: number };
};
type Brand = {
  id: string; name: string; slug: string; description: string | null; logoUrl: string | null;
  active: boolean; featured: boolean; _count: { products: number };
};
type Attribute = {
  id: string; categoryId: string; name: string; slug: string; type: string;
  required: boolean; active: boolean; options: unknown;
};
type CategoryForm = {
  name: string; slug: string; description: string; imageUrl: string;
  sortOrder: string; parentId: string; visible: boolean;
};
type BrandForm = {
  name: string; slug: string; description: string; logoUrl: string;
  featured: boolean; active: boolean;
};

const blankCategory: CategoryForm = {
  name: "", slug: "", description: "", imageUrl: "", sortOrder: "0", parentId: "", visible: true,
};
const blankBrand: BrandForm = {
  name: "", slug: "", description: "", logoUrl: "", featured: false, active: true,
};
const inputClass = "w-full rounded-xl border border-black/15 bg-white px-3 py-2.5 text-sm font-semibold outline-none focus:border-black";
const buttonClass = "rounded-xl bg-black px-4 py-2.5 text-xs font-black text-white hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-50";
const secondaryButton = "rounded-xl border border-black/15 px-3 py-2 text-xs font-bold disabled:opacity-50";
const labelClass = "grid gap-1 text-xs font-bold text-black/60";

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init, credentials: "same-origin", cache: "no-store",
    headers: { ...(init?.body ? { "Content-Type": "application/json" } : {}), ...init?.headers },
  });
  const payload = await response.json().catch(() => null) as { ok?: boolean; data?: T; error?: string } | null;
  if (!response.ok || !payload?.ok) throw new Error(payload?.error || "Catalog request failed.");
  return payload.data as T;
}

export function CatalogManagement() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [categoryForm, setCategoryForm] = useState<CategoryForm>(blankCategory);
  const [brandForm, setBrandForm] = useState<BrandForm>(blankBrand);
  const [categoryEditingId, setCategoryEditingId] = useState<string | null>(null);
  const [brandEditingId, setBrandEditingId] = useState<string | null>(null);
  const [categoryQuery, setCategoryQuery] = useState("");
  const [brandQuery, setBrandQuery] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [attributeForm, setAttributeForm] = useState({ categoryId: "", name: "", type: "TEXT", options: "", required: false });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [nextCategories, nextBrands, nextAttributes] = await Promise.all([
        request<Category[]>("/api/admin-app/catalog/categories?archived=true"),
        request<Brand[]>("/api/admin-app/catalog/brands?inactive=true"),
        request<Attribute[]>("/api/admin-app/catalog/attributes"),
      ]);
      setCategories(nextCategories);
      setBrands(nextBrands);
      setAttributes(nextAttributes);
      setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load catalog management.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const filteredCategories = useMemo(() => categories.filter((item) =>
    (showArchived || !item.archived) &&
    [item.name, item.slug, item.parent?.name ?? ""].join(" ").toLowerCase().includes(categoryQuery.trim().toLowerCase())
  ), [categories, categoryQuery, showArchived]);
  const filteredBrands = useMemo(() => brands.filter((item) =>
    [item.name, item.slug].join(" ").toLowerCase().includes(brandQuery.trim().toLowerCase())
  ), [brands, brandQuery]);

  async function mutate(url: string, method: "POST" | "PATCH" | "DELETE", body?: unknown) {
    setError(""); setNotice(""); setBusy(true);
    try {
      await request(url, { method, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
      await load();
      setNotice("Saved successfully in the store database.");
      return true;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save changes.");
      return false;
    } finally { setBusy(false); }
  }

  function resetCategory() { setCategoryEditingId(null); setCategoryForm({ ...blankCategory }); }
  function resetBrand() { setBrandEditingId(null); setBrandForm({ ...blankBrand }); }

  async function saveCategory(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const ok = await mutate(
      categoryEditingId ? "/api/admin-app/catalog/categories/" + encodeURIComponent(categoryEditingId) : "/api/admin-app/catalog/categories",
      categoryEditingId ? "PATCH" : "POST",
      { ...categoryForm, parentId: categoryForm.parentId || null, sortOrder: Number(categoryForm.sortOrder) }
    );
    if (ok) resetCategory();
  }
  async function saveBrand(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const ok = await mutate(
      brandEditingId ? "/api/admin-app/catalog/brands/" + encodeURIComponent(brandEditingId) : "/api/admin-app/catalog/brands",
      brandEditingId ? "PATCH" : "POST", brandForm
    );
    if (ok) resetBrand();
  }
  function editCategory(item: Category) {
    setCategoryEditingId(item.id);
    setCategoryForm({
      name: item.name, slug: item.slug, description: item.description ?? "",
      imageUrl: item.imageUrl ?? "", sortOrder: String(item.sortOrder),
      parentId: item.parentId ?? "", visible: item.visible,
    });
    setError(""); setNotice("");
  }
  function editBrand(item: Brand) {
    setBrandEditingId(item.id);
    setBrandForm({
      name: item.name, slug: item.slug, description: item.description ?? "",
      logoUrl: item.logoUrl ?? "", featured: item.featured, active: item.active,
    });
    setError(""); setNotice("");
  }
  async function archiveCategory(item: Category) {
    if (item._count.products || item._count.children) {
      setError("Move products and child categories before archiving this category.");
      return;
    }
    if (!window.confirm("Archive category " + item.name + "?")) return;
    const ok = await mutate("/api/admin-app/catalog/categories/" + encodeURIComponent(item.id), "DELETE");
    if (ok && categoryEditingId === item.id) resetCategory();
  }
  async function deactivateBrand(item: Brand) {
    if (!window.confirm("Deactivate brand " + item.name + "?")) return;
    const ok = await mutate("/api/admin-app/catalog/brands/" + encodeURIComponent(item.id), "DELETE");
    if (ok && brandEditingId === item.id) resetBrand();
  }

  return <div className="space-y-6">
    <header>
      <p className="text-xs font-black uppercase tracking-[.18em] text-black/35">Catalog management</p>
      <h1 className="mt-1 text-3xl font-black tracking-[-.05em]">Categories, brands & attributes</h1>
      <p className="mt-2 max-w-3xl text-sm font-medium text-black/55">
        Create, edit, publish, hide and restore storefront classifications. Changes use owner-authenticated APIs and persist to the database.
      </p>
    </header>
    {error ? <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-800">{error} <button className="underline" onClick={() => void load()}>Retry</button></div> : null}
    {notice ? <div role="status" className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-bold text-green-800">{notice}</div> : null}
    {loading ? <p role="status" className="text-sm font-semibold text-black/50">Loading live catalog data…</p> : null}

    <div className="grid items-start gap-6 xl:grid-cols-2">
      <section className="rounded-[28px] border border-black/10 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-black">{categoryEditingId ? "Edit category" : "Add category"}</h2>
          {categoryEditingId ? <button type="button" className={secondaryButton} onClick={resetCategory}>Cancel edit</button> : null}
        </div>
        <form onSubmit={(event) => void saveCategory(event)} className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className={labelClass}>Category name<input required minLength={2} className={inputClass} value={categoryForm.name} onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })} /></label>
          <label className={labelClass}>Slug<input className={inputClass} placeholder="Auto from name" value={categoryForm.slug} onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })} /></label>
          <label className={labelClass}>Parent category<select className={inputClass} value={categoryForm.parentId} onChange={(e) => setCategoryForm({ ...categoryForm, parentId: e.target.value })}>
            <option value="">Top-level category</option>
            {categories.filter((item) => !item.archived && !item.parentId && item.id !== categoryEditingId).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select></label>
          <label className={labelClass}>Display order<input className={inputClass} type="number" min={-100000} max={100000} step={1} required value={categoryForm.sortOrder} onChange={(e) => setCategoryForm({ ...categoryForm, sortOrder: e.target.value })} /></label>
          <label className={labelClass + " sm:col-span-2"}>Description<textarea className={inputClass} rows={2} value={categoryForm.description} onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })} /></label>
          <label className={labelClass + " sm:col-span-2"}>Category image (approved HTTPS URL)<input className={inputClass} type="url" placeholder="https://..." value={categoryForm.imageUrl} onChange={(e) => setCategoryForm({ ...categoryForm, imageUrl: e.target.value })} /></label>
          <label className="flex items-center gap-2 text-sm font-bold sm:col-span-2"><input type="checkbox" checked={categoryForm.visible} onChange={(e) => setCategoryForm({ ...categoryForm, visible: e.target.checked })} /> Visible in storefront</label>
          <button disabled={busy} className={buttonClass + " sm:col-span-2"}>{busy ? "Saving…" : categoryEditingId ? "Save category changes" : "Create category"}</button>
        </form>
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <input aria-label="Search categories" className={inputClass + " min-w-[160px] flex-1"} placeholder="Search categories…" value={categoryQuery} onChange={(e) => setCategoryQuery(e.target.value)} />
          <label className="flex items-center gap-2 text-xs font-bold"><input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} /> Show archived</label>
        </div>
        <div className="mt-3 divide-y divide-black/10">
          {filteredCategories.map((item) => <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div className="min-w-0">
              <p className="font-black">{item.parent ? "↳ " : ""}{item.name}</p>
              <p className="text-xs font-semibold text-black/45">{item.slug} · {item._count.products} products · {item._count.children} children · {item.archived ? "Archived" : item.visible ? "Visible" : "Hidden"}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button disabled={busy} className={secondaryButton} onClick={() => editCategory(item)}>Edit</button>
              {item.archived ?
                <button disabled={busy} className={secondaryButton} onClick={() => void mutate("/api/admin-app/catalog/categories/" + encodeURIComponent(item.id), "PATCH", { archived: false, visible: true })}>Restore</button> :
                <><button disabled={busy} className={secondaryButton} onClick={() => void mutate("/api/admin-app/catalog/categories/" + encodeURIComponent(item.id), "PATCH", { visible: !item.visible })}>{item.visible ? "Hide" : "Show"}</button>
                <button disabled={busy || item._count.products > 0 || item._count.children > 0} title="Category must have no linked products or children" className={secondaryButton} onClick={() => void archiveCategory(item)}>Archive</button></>}
            </div>
          </div>)}
          {!loading && filteredCategories.length === 0 ? <p className="py-5 text-sm text-black/45">No matching categories.</p> : null}
        </div>
      </section>

      <section className="rounded-[28px] border border-black/10 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-black">{brandEditingId ? "Edit brand" : "Add brand"}</h2>
          {brandEditingId ? <button type="button" className={secondaryButton} onClick={resetBrand}>Cancel edit</button> : null}
        </div>
        <form onSubmit={(event) => void saveBrand(event)} className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className={labelClass}>Brand name<input required minLength={2} className={inputClass} value={brandForm.name} onChange={(e) => setBrandForm({ ...brandForm, name: e.target.value })} /></label>
          <label className={labelClass}>Slug<input className={inputClass} placeholder="Auto from name" value={brandForm.slug} onChange={(e) => setBrandForm({ ...brandForm, slug: e.target.value })} /></label>
          <label className={labelClass + " sm:col-span-2"}>Description<textarea className={inputClass} rows={2} value={brandForm.description} onChange={(e) => setBrandForm({ ...brandForm, description: e.target.value })} /></label>
          <label className={labelClass + " sm:col-span-2"}>Brand logo (approved HTTPS URL)<input type="url" className={inputClass} placeholder="https://..." value={brandForm.logoUrl} onChange={(e) => setBrandForm({ ...brandForm, logoUrl: e.target.value })} /></label>
          <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={brandForm.active} onChange={(e) => setBrandForm({ ...brandForm, active: e.target.checked })} /> Active</label>
          <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={brandForm.featured} onChange={(e) => setBrandForm({ ...brandForm, featured: e.target.checked })} /> Featured</label>
          <button disabled={busy} className={buttonClass + " sm:col-span-2"}>{busy ? "Saving…" : brandEditingId ? "Save brand changes" : "Create brand"}</button>
        </form>
        <div className="mt-6"><input aria-label="Search brands" className={inputClass} placeholder="Search brands…" value={brandQuery} onChange={(e) => setBrandQuery(e.target.value)} /></div>
        <div className="mt-3 divide-y divide-black/10">
          {filteredBrands.map((item) => <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div className="min-w-0">
              <p className="font-black">{item.name}{item.featured ? " · Featured" : ""}</p>
              <p className="text-xs font-semibold text-black/45">{item.slug} · {item._count.products} products · {item.active ? "Active" : "Inactive"}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button disabled={busy} className={secondaryButton} onClick={() => editBrand(item)}>Edit</button>
              {item.active ?
                <button disabled={busy} className={secondaryButton} onClick={() => void deactivateBrand(item)}>Deactivate</button> :
                <button disabled={busy} className={secondaryButton} onClick={() => void mutate("/api/admin-app/catalog/brands/" + encodeURIComponent(item.id), "PATCH", { active: true })}>Activate</button>}
            </div>
          </div>)}
          {!loading && filteredBrands.length === 0 ? <p className="py-5 text-sm text-black/45">No matching brands.</p> : null}
        </div>
      </section>
    </div>

    <section className="rounded-[28px] border border-black/10 bg-white p-5 shadow-sm">
      <h2 className="text-xl font-black">Category-specific attributes</h2>
      <p className="mt-1 text-sm text-black/50">Attribute definitions are stored per category and validated when a product is saved.</p>
      <form className="mt-4 grid gap-3 md:grid-cols-5" onSubmit={(event) => {
        event.preventDefault();
        void (async () => {
          const ok = await mutate("/api/admin-app/catalog/attributes", "POST", {
            ...attributeForm, options: attributeForm.options.split(",").map((value) => value.trim()).filter(Boolean),
          });
          if (ok) setAttributeForm({ categoryId: "", name: "", type: "TEXT", options: "", required: false });
        })();
      }}>
        <select aria-label="Attribute category" className={inputClass} value={attributeForm.categoryId} onChange={(e) => setAttributeForm({ ...attributeForm, categoryId: e.target.value })} required>
          <option value="">Select category</option>
          {categories.filter((item) => !item.archived).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
        <input aria-label="Attribute name" className={inputClass} placeholder="Attribute name" minLength={2} required value={attributeForm.name} onChange={(e) => setAttributeForm({ ...attributeForm, name: e.target.value })} />
        <select aria-label="Attribute type" className={inputClass} value={attributeForm.type} onChange={(e) => setAttributeForm({ ...attributeForm, type: e.target.value })}>
          {["TEXT", "NUMBER", "SELECT", "MULTI_SELECT", "BOOLEAN", "COLOR", "DATE", "IMAGE_REQUEST"].map((type) => <option key={type}>{type}</option>)}
        </select>
        <input aria-label="Attribute options" className={inputClass} placeholder="Options (comma-separated)" value={attributeForm.options} onChange={(e) => setAttributeForm({ ...attributeForm, options: e.target.value })} />
        <button disabled={busy} className={buttonClass}>Add attribute</button>
        <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={attributeForm.required} onChange={(e) => setAttributeForm({ ...attributeForm, required: e.target.checked })} /> Required</label>
      </form>
      <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {attributes.filter((item) => item.active).map((item) => <div className="rounded-2xl bg-[#f5f5f1] p-4" key={item.id}>
          <p className="font-black">{item.name}{item.required ? " · Required" : ""}</p>
          <p className="mt-1 text-xs font-semibold text-black/50">{item.type} · {item.slug} · {categories.find((category) => category.id === item.categoryId)?.name ?? "Category unavailable"}</p>
        </div>)}
        {!loading && attributes.filter((item) => item.active).length === 0 ? <p className="text-sm text-black/45">No active attributes.</p> : null}
      </div>
    </section>
  </div>;
}
