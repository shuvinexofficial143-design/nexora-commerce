"use client";

import { useCallback, useEffect, useState } from "react";
import { BannerPreview, type BannerDraft } from "@/components/admin/banner-preview";

type Banner = {
  id: string; title: string; description: string | null; imageUrl: string;
  mobileImageUrl: string | null; ctaText: string; ctaHref: string;
  categorySlug: string | null; sortOrder: number; published: boolean; archived: boolean;
};
const empty: BannerDraft = {
  title: "", description: "", imageUrl: "", mobileImageUrl: "",
  ctaText: "Shop now", ctaHref: "/shop", categorySlug: "", sortOrder: "0", published: false,
};
const inputClass = "w-full rounded-xl border border-black/10 bg-[#fafaf7] px-3 py-2.5 text-sm font-bold";
const pill = "rounded-full border border-black/10 px-4 py-2 text-xs font-black disabled:opacity-50";
type ApiResponse<T> = { ok: boolean; data?: T; error?: string };

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init, credentials: "same-origin", cache: "no-store",
    headers: { ...(init?.body ? { "Content-Type": "application/json" } : {}), ...init?.headers },
  });
  const payload = await response.json().catch(() => null) as ApiResponse<T> | null;
  if (!response.ok || !payload?.ok || payload.data === undefined) throw new Error(payload?.error || "Banner request failed.");
  return payload.data;
}

export function CmsHeroEditor() {
  const [rows, setRows] = useState<Banner[]>([]);
  const [form, setForm] = useState<BannerDraft>({ ...empty });
  const [editing, setEditing] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    try {
      setRows(await request<Banner[]>("/api/admin-app/banners"));
      setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load banners.");
    } finally { setLoading(false); }
  }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);
  function reset() { setEditing(null); setForm({ ...empty }); }
  function edit(row: Banner) {
    setEditing(row.id);
    setForm({
      title: row.title, description: row.description || "", imageUrl: row.imageUrl,
      mobileImageUrl: row.mobileImageUrl || "", ctaText: row.ctaText, ctaHref: row.ctaHref,
      categorySlug: row.categorySlug || "", sortOrder: String(row.sortOrder), published: row.published,
    });
    setError(""); setNotice("");
  }
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError(""); setNotice("");
    try {
      await request<Banner>(editing ? "/api/admin-app/banners/" + encodeURIComponent(editing) : "/api/admin-app/banners", {
        method: editing ? "PATCH" : "POST",
        body: JSON.stringify({ ...form, sortOrder: Number(form.sortOrder) }),
      });
      await load();
      reset();
      setNotice("Banner saved. Publishing is controlled by its status.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Banner save failed.");
    } finally { setBusy(false); }
  }
  async function setArchived(row: Banner, archived: boolean) {
    if (busy || !window.confirm((archived ? "Archive " : "Restore ") + row.title + "?")) return;
    setBusy(true); setError(""); setNotice("");
    try {
      await request<Banner>("/api/admin-app/banners/" + encodeURIComponent(row.id), {
        method: "PATCH",
        body: JSON.stringify({ ...row, archived, published: false }),
      });
      await load();
      if (editing === row.id) reset();
      setNotice(archived ? "Banner archived; hidden from the storefront." : "Banner restored as a draft.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not change archive status.");
    } finally { setBusy(false); }
  }
  const setValue = (key: keyof BannerDraft, value: string | boolean) => setForm((current) => ({ ...current, [key]: value }));
  return <div className="space-y-5">
    {error ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error} <button type="button" onClick={() => void load()} className="underline">Retry</button></p> : null}
    {notice ? <p role="status" className="rounded-xl bg-green-50 p-3 text-sm font-bold text-green-800">{notice}</p> : null}
    <form onSubmit={(event) => void save(event)} className="grid gap-3 rounded-3xl border border-black/10 bg-white p-5 md:grid-cols-2">
      <p className="md:col-span-2 text-xs font-black uppercase tracking-[.18em] text-black/40">{editing ? "Edit homepage banner" : "Create homepage banner"}</p>
      {(["title", "ctaText", "ctaHref", "categorySlug", "sortOrder", "imageUrl", "mobileImageUrl"] as const).map((key) => {
        const labels: Record<typeof key, string> = {
          title: "Title", ctaText: "CTA text", ctaHref: "CTA link", categorySlug: "Category / collection",
          sortOrder: "Display order", imageUrl: "Desktop image URL", mobileImageUrl: "Mobile image URL",
        };
        return <label key={key} className={"grid gap-1 text-xs font-black text-black/40 " + (key.includes("Url") ? "md:col-span-2" : "")}>
          {labels[key]}
          <input aria-label={labels[key]} required={["title","ctaText","ctaHref","imageUrl"].includes(key)}
            value={form[key]} onChange={(event) => setValue(key, event.target.value)}
            type={key === "sortOrder" ? "number" : "text"} min={key === "sortOrder" ? 0 : undefined}
            className={inputClass} />
        </label>;
      })}
      <label className="grid gap-1 text-xs font-black text-black/40 md:col-span-2">Description
        <textarea aria-label="Banner description" value={form.description} onChange={(event) => setValue("description", event.target.value)}
          rows={3} className={inputClass} />
      </label>
      <label className="flex items-center gap-2 text-sm font-bold">
        <input type="checkbox" checked={form.published} onChange={(event) => setValue("published", event.target.checked)} />
        Publish on homepage
      </label>
      <BannerPreview banner={form} />
      <div className="flex flex-wrap gap-2 md:col-span-2">
        <button disabled={busy} className="rounded-full bg-black px-5 py-2.5 text-sm font-black text-white disabled:opacity-50">{busy ? "Saving…" : editing ? "Save banner" : "Create banner"}</button>
        {editing ? <button type="button" disabled={busy} onClick={reset} className={pill}>Cancel</button> : null}
      </div>
    </form>
    {loading ? <p role="status" className="text-sm font-bold text-black/40">Loading homepage banners…</p> : null}
    <div className="space-y-2">
      {rows.map((row) => <div key={row.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-black/10 bg-white p-4">
        <div className="min-w-0">
          <p className="font-black">{row.title}</p>
          <p className="text-xs font-bold text-black/40">{row.archived ? "Archived" : row.published ? "Published" : "Draft"} · order {row.sortOrder}</p>
        </div>
        <div className="flex gap-2">
          {!row.archived ? <>
            <button type="button" disabled={busy} onClick={() => edit(row)} className={pill}>Edit</button>
            <button type="button" disabled={busy} onClick={() => void setArchived(row, true)} className={pill + " text-red-700"}>Archive</button>
          </> : <button type="button" disabled={busy} onClick={() => void setArchived(row, false)} className={pill}>Restore</button>}
        </div>
      </div>)}
      {!loading && rows.length === 0 ? <p className="text-sm font-medium text-black/40">No homepage banners saved yet.</p> : null}
    </div>
  </div>;
}
