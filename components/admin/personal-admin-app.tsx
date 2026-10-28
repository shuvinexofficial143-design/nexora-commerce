"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminMediaUpload } from "@/components/admin/admin-media-upload";
import { ProductGalleryEditor } from "@/components/admin/product-gallery-editor";
import { ProductPreviewPanel } from "@/components/admin/product-preview";
import type { BulkProductAction } from "@/lib/admin/product-bulk";
import { CmsHeroEditor } from "@/components/admin/cms-hero-editor";
import { CatalogManagement } from "@/components/admin/catalog-management";
import { ProductAttributeEditor } from "@/components/admin/product-attribute-editor";
import { activeProductAttributes, normalizeAttributeDraft, type ProductAttributeDefinition } from "@/lib/admin/attribute-input";

type Envelope<T> = { ok: true; data: T } | { ok: false; error: string };

async function adminFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    credentials: "same-origin",
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...(init?.headers ?? {}),
    },
  });

  const payload = (await response.json().catch(() => null)) as Envelope<T> | null;
  if (!response.ok || !payload || !payload.ok) {
    throw new Error(payload && !payload.ok ? payload.error : "Admin request failed.");
  }
  return payload.data;
}

type AdminMe = {
  user: { id: string; name: string; email: string; role: string };
  expiresAt: string;
};

type DashboardData = {
  stats: { revenueMinor: number; orders: number; customers: number; lowStock: number };
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    customer: string;
    customerEmail: string;
    totalMinor: number;
    status: string;
    paymentStatus: string;
    paymentMethod: string | null;
    itemCount: number;
    createdAt: string;
  }>;
};

type ProductRow = {
  id: string;
  slug: string;
  sku: string;
  name: string;
  description: string;
  priceMinor: number;
  compareAtMinor: number | null;
  status: string;
  featured: boolean;
  brand: string | null;
  category: string | null;
  categorySlug: string | null;
  brandSlug: string | null;
  attributes: Record<string, unknown> | null;
  onHand: number;
  reserved: number;
  videoUrl: string | null;
  posterUrl: string | null;
  media: Array<{ url: string; alt: string; sortOrder: number }>;
  updatedAt: string;
};

type CatalogOption = { id: string; name: string; slug: string };
type CatalogOptions = { categories: CatalogOption[]; brands: CatalogOption[] };

type OrderRow = {
  id: string;
  orderNumber: string;
  customer: { id: string; name: string; email: string; phone: string | null };
  totalMinor: number;
  subtotalMinor: number;
  taxMinor: number;
  shippingMinor: number;
  discountMinor: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string | null;
  itemCount: number;
  createdAt: string;
};

type InventoryRow = {
  id: string;
  product: { id: string; name: string; sku: string; slug: string };
  warehouse: { id: string; code: string; name: string; city: string; state: string };
  onHand: number;
  reserved: number;
  available: number;
  reorderLevel: number;
  lowStock: boolean;
  updatedAt: string;
};

type CouponRow = {
  id: string;
  code: string;
  kind: string;
  value: number;
  minSubtotalMinor: number;
  maxDiscountMinor: number | null;
  active: boolean;
  usageCount?: number;
  createdAt?: string;
};

type ReturnRow = {
  id: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  reason: string;
  details?: string | null;
  status?: string;
  refundMinor?: number;
  refundProcessedAt?: string | null;
  restockedAt?: string | null;
  paymentMethod?: string | null;
  paymentStatus?: string;
  orderStatus?: string;
  totalMinor?: number;
  createdAt?: string;
};

type RefundActionResult = {
  state: string;
  provider?: string;
  refundId?: string | null;
  refundArn?: string | null;
  message?: string | null;
  finalized?: boolean;
};

type NotificationRow = {
  id: string;
  type: string;
  title: string;
  message: string;
  entityType?: string | null;
  entityId?: string | null;
  severity?: string | null;
  createdAt: string;
  readAt: string | null;
};

type IntegrationStatus = {
  storeProfile: {
    configured: boolean;
    missing: string[];
  };
  deployment: {
    appUrl: string;
    environment: string;
    commit: string | null;
  };
  integrations: {
    cashfree: {
      configured: boolean;
      mode: string;
      storefrontEnabled: boolean;
    };
    cloudinary: {
      configured: boolean;
    };
    email: {
      configured: boolean;
      provider: string;
    };
  };
};

const money = (minor: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format((minor || 0) / 100);

function Panel({
  title,
  description,
  children,
  action,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-black/10 bg-white p-5 shadow-[0_18px_55px_rgba(17,17,15,.05)] sm:p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-black tracking-[-.03em]">{title}</h2>
          {description ? <p className="mt-1 text-sm font-medium text-black/45">{description}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function LoadingBlock() {
  return <div className="rounded-[24px] border border-black/10 bg-white p-8 text-sm font-bold text-black/45">Loading live data…</div>;
}

function ErrorBlock({ error, retry }: { error: string; retry: () => void }) {
  return (
    <div className="rounded-[24px] border border-red-200 bg-red-50 p-5 text-sm font-bold text-red-800">
      {error}
      <button onClick={retry} className="ml-3 underline underline-offset-4">Retry</button>
    </div>
  );
}

function Overview() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    adminFetch<DashboardData>("/api/admin-app/dashboard").then(setData).catch((e) => setError(e.message));
  }, []);

  useEffect(() => load(), [load]);

  if (error) return <ErrorBlock error={error} retry={load} />;
  if (!data) return <LoadingBlock />;

  const stats = [
    ["Revenue", money(data.stats.revenueMinor), "₹"],
    ["Orders", data.stats.orders.toLocaleString("en-IN"), "▣"],
    ["Customers", data.stats.customers.toLocaleString("en-IN"), "◉"],
    ["Low stock", data.stats.lowStock.toLocaleString("en-IN"), "!"],
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-black uppercase tracking-[.18em] text-black/35">Owner overview</p>
        <h1 className="mt-1 text-3xl font-black tracking-[-.05em]">Store control center</h1>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(([label, value, icon]) => (
          <div key={label} className="rounded-[26px] border border-black/10 bg-white p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-black uppercase tracking-wide text-black/40">{label}</p>
              <span className="grid h-9 w-9 place-items-center rounded-full bg-[#d7ff47] text-sm font-black">{icon}</span>
            </div>
            <p className="mt-4 text-3xl font-black tracking-[-.05em]">{value}</p>
          </div>
        ))}
      </div>

      <Panel title="Recent orders" description="Latest real orders from the database">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-black/35">
              <tr>
                <th className="pb-3">Order</th><th className="pb-3">Customer</th><th className="pb-3">Items</th>
                <th className="pb-3">Payment</th><th className="pb-3">Status</th><th className="pb-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/8">
              {data.recentOrders.map((order) => (
                <tr key={order.id}>
                  <td className="py-4 font-black">{order.orderNumber}</td>
                  <td className="py-4"><b>{order.customer}</b><p className="text-xs text-black/40">{order.customerEmail}</p></td>
                  <td className="py-4 font-bold">{order.itemCount}</td>
                  <td className="py-4 font-bold uppercase">{order.paymentMethod || "—"}</td>
                  <td className="py-4"><span className="rounded-full bg-black/5 px-2.5 py-1 text-xs font-black">{order.status}</span></td>
                  <td className="py-4 text-right font-black">{money(order.totalMinor)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function Products() {
  const [rows, setRows] = useState<ProductRow[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [options, setOptions] = useState<CatalogOptions>({ categories: [], brands: [] });
  const [attributeDefinitions, setAttributeDefinitions] = useState<ProductAttributeDefinition[]>([]);
  const [attributeError, setAttributeError] = useState("");
  const [attributesLoading, setAttributesLoading] = useState(true);
  const [draftAttributes, setDraftAttributes] = useState<Record<string, unknown>>({});
  const [draftGallery, setDraftGallery] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<BulkProductAction>("PUBLISH");
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkNotice, setBulkNotice] = useState("");
  const visibleProducts = rows.filter((product) =>
    (statusFilter === "ALL" || product.status === statusFilter) &&
    [product.name, product.sku, product.brand || "", product.category || ""].join(" ").toLowerCase().includes(query.toLowerCase())
  );
  const eligibleVisible = visibleProducts.filter((product) => product.status !== "ARCHIVED");
  const selectedProducts = rows.filter((product) => selectedIds.includes(product.id));
  const bulkLabels: Record<BulkProductAction, string> = {
    PUBLISH: "Publish selected products",
    MOVE_TO_DRAFT: "Move selected products to draft",
    FEATURE: "Mark selected products featured",
    UNFEATURE: "Remove selected products from featured",
  };
  const [form, setForm] = useState({
    name: "", sku: "", price: "", compareAtPrice: "", description: "", videoUrl: "", posterUrl: "", categorySlug: "", brandSlug: "",
  });

  const load = useCallback(() => {
    adminFetch<ProductRow[]>("/api/admin-app/products").then(setRows).catch((e) => setError(e.message));
  }, []);

  useEffect(() => load(), [load]);
  useEffect(() => {
    adminFetch<CatalogOptions>("/api/admin-app/catalog/options")
      .then(setOptions)
      .catch((e) => setError(e.message));
    adminFetch<ProductAttributeDefinition[]>("/api/admin-app/catalog/attributes")
      .then((data) => { setAttributeDefinitions(data); setAttributeError(""); })
      .catch((e: Error) => setAttributeError(e.message))
      .finally(() => setAttributesLoading(false));
  }, []);

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (attributesLoading || attributeError) throw new Error("Category attributes could not be loaded. Please retry.");
      const categoryId = options.categories.find((item) => item.slug === form.categorySlug)?.id;
      const definitions = activeProductAttributes(attributeDefinitions, categoryId);
      const attributes = categoryId ? normalizeAttributeDraft(definitions, draftAttributes) : undefined;
      await adminFetch("/api/admin-app/products/manage", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          price: Number(form.price),
          compareAtPrice: form.compareAtPrice ? Number(form.compareAtPrice) : null,
          categorySlug: form.categorySlug,
          brandSlug: form.brandSlug,
          status: "DRAFT",
          images: draftGallery,
          ...(attributes !== undefined ? { attributes } : {}),
        }),
      });
      setForm({ name: "", sku: "", price: "", compareAtPrice: "", description: "", videoUrl: "", posterUrl: "", categorySlug: "", brandSlug: "" });
      setDraftAttributes({});
      setDraftGallery([]);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create product.");
    } finally {
      setBusy(false);
    }
  }

  async function updateProduct(product: ProductRow, patch: Record<string, unknown>) {
    setError("");
    try {
      await adminFetch(`/api/admin-app/products/${encodeURIComponent(product.id)}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update product.");
      throw e;
    }
  }

  async function applyBulkAction() {
    if (!selectedProducts.length || selectedProducts.length > 25 || bulkBusy || busy) return;
    const preview = selectedProducts.slice(0, 4).map((product) => product.name).join(", ");
    const summary = selectedProducts.length > 4 ? preview + ", and more" : preview;
    if (!window.confirm(bulkLabels[bulkAction] + " for " + selectedProducts.length + " product(s)?\n" + summary + "\nInventory, orders and pricing will not change.")) return;
    setBulkBusy(true);
    setBulkNotice("");
    setError("");
    try {
      const result = await adminFetch<{ changed: number; unchanged: number }>("/api/admin-app/products/bulk", {
        method: "POST",
        body: JSON.stringify({
          action: bulkAction,
          products: selectedProducts.map((product) => ({ id: product.id, updatedAt: product.updatedAt })),
        }),
      });
      setBulkNotice(result.changed + " products updated, " + result.unchanged + " already matched.");
      setSelectedIds([]);
      load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Bulk operation could not be completed.");
      setSelectedIds([]);
      load();
    } finally {
      setBulkBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-black uppercase tracking-[.18em] text-black/35">Catalog</p>
        <h1 className="mt-1 text-3xl font-black tracking-[-.05em]">Products</h1>
      </div>

      {error ? <ErrorBlock error={error} retry={load} /> : null}
      {bulkNotice ? <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">{bulkNotice}</p> : null}

      <Panel title="Add product" description="Create a category-ready draft product with optional media">
        <form onSubmit={create} className="grid gap-3 md:grid-cols-2">
          {[
            ["name", "Product name", "Gift product"],
            ["sku", "SKU", "NX-GIFT-001"],
            ["price", "Price (₹)", "999"],
              ["compareAtPrice", "Compare-at price (optional)", "1299"],
          ].map(([key, label, placeholder]) => (
            <label key={key}>
              <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-black/40">{label}</span>
              <input
                value={form[key as keyof typeof form]}
                onChange={(e) => setForm((current) => ({ ...current, [key]: e.target.value }))}
                placeholder={placeholder}
                type={key === "price" ? "number" : "text"}
                className="w-full rounded-2xl border border-black/10 bg-[#f7f7f3] px-4 py-3 text-sm font-bold outline-none focus:border-black"
              />
            </label>
          ))}

          <label>
            <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-black/40">Category</span>
            <select value={form.categorySlug} onChange={(e) => { setForm((current) => ({ ...current, categorySlug: e.target.value })); setDraftAttributes({}); }} className="w-full rounded-2xl border border-black/10 bg-[#f7f7f3] px-4 py-3 text-sm font-bold outline-none focus:border-black">
              <option value="">Select category</option>
              {options.categories.map((option) => <option key={option.slug} value={option.slug}>{option.name}</option>)}
            </select>
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-black/40">Brand</span>
            <select value={form.brandSlug} onChange={(e) => setForm((current) => ({ ...current, brandSlug: e.target.value }))} className="w-full rounded-2xl border border-black/10 bg-[#f7f7f3] px-4 py-3 text-sm font-bold outline-none focus:border-black">
              <option value="">Select brand</option>
              {options.brands.map((option) => <option key={option.slug} value={option.slug}>{option.name}</option>)}
            </select>
          </label>

          {form.categorySlug ? <ProductAttributeEditor
            definitions={activeProductAttributes(attributeDefinitions, options.categories.find((item) => item.slug === form.categorySlug)?.id)}
            value={draftAttributes}
            onChange={setDraftAttributes}
            loading={attributesLoading}
            error={attributeError}
            disabled={busy}
          /> : null}
          <label className="md:col-span-2">
            <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-black/40">Product video</span>
            <input
              value={form.videoUrl}
              onChange={(e) => setForm((current) => ({ ...current, videoUrl: e.target.value }))}
              placeholder="YouTube or HTTPS MP4/WebM URL"
              type="url"
              className="w-full rounded-2xl border border-black/10 bg-[#f7f7f3] px-4 py-3 text-sm font-bold outline-none focus:border-black"
            />
            <AdminMediaUpload
              resourceType="video"
              label="Upload product video"
              onUploaded={(url) => setForm((current) => ({ ...current, videoUrl: url }))}
            />
          </label>

          <label className="md:col-span-2">
            <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-black/40">Poster image</span>
            <input
              value={form.posterUrl}
              onChange={(e) => setForm((current) => ({ ...current, posterUrl: e.target.value }))}
              placeholder="Cloudinary / Supabase / YouTube / Unsplash URL"
              type="url"
              className="w-full rounded-2xl border border-black/10 bg-[#f7f7f3] px-4 py-3 text-sm font-bold outline-none focus:border-black"
            />
            <AdminMediaUpload
              resourceType="image"
              label="Upload poster image"
              onUploaded={(url) => setForm((current) => ({ ...current, posterUrl: url }))}
            />
          </label>
          <ProductGalleryEditor value={draftGallery} onChange={setDraftGallery} disabled={busy} />
          <label className="md:col-span-2">
            <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-black/40">Description</span>
            <textarea
              value={form.description}
              onChange={(e) => setForm((current) => ({ ...current, description: e.target.value }))}
              rows={4}
              className="w-full rounded-2xl border border-black/10 bg-[#f7f7f3] px-4 py-3 text-sm font-bold outline-none focus:border-black"
            />
          </label>
          <ProductPreviewPanel name={form.name} price={form.price} compareAtPrice={form.compareAtPrice} description={form.description} posterUrl={form.posterUrl} gallery={draftGallery} videoUrl={form.videoUrl} status="DRAFT" />
          <button disabled={busy || attributesLoading || Boolean(attributeError)} className="rounded-full bg-black px-5 py-3 text-sm font-black text-white md:col-span-2 disabled:opacity-50">
            {busy ? "Creating…" : "Create draft product"}
          </button>
        </form>
      </Panel>

      <Panel title="All products" description={`${rows.length} products in database`}>
        <div className="mb-4 flex flex-wrap gap-2">
          <input value={query} onChange={(e) => { setQuery(e.target.value); setSelectedIds([]); }} placeholder="Search name, SKU, brand…" className="min-w-[240px] flex-1 rounded-full border border-black/10 bg-[#fafaf7] px-4 py-2.5 text-sm font-bold outline-none" />
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setSelectedIds([]); }} className="rounded-full border border-black/10 bg-[#fafaf7] px-4 py-2.5 text-sm font-bold"><option>ALL</option><option>DRAFT</option><option>ACTIVE</option><option>ARCHIVED</option></select>
        </div>
        <div className="mb-4 space-y-3 rounded-2xl border border-black/10 bg-[#f5f5f1] p-4">
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => setSelectedIds(eligibleVisible.slice(0, 25).map((product) => product.id))} disabled={bulkBusy || eligibleVisible.length === 0} className="rounded-xl border border-black/20 bg-white px-3 py-2 text-xs font-black disabled:opacity-40">Select first 25 filtered</button>
            <button type="button" onClick={() => setSelectedIds([])} disabled={bulkBusy || !selectedIds.length} className="rounded-xl border border-black/20 bg-white px-3 py-2 text-xs font-black disabled:opacity-40">Clear selection</button>
            <span className="ml-auto text-xs font-black">{selectedProducts.length} / 25 selected</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <select aria-label="Bulk product action" value={bulkAction} onChange={(event) => setBulkAction(event.target.value as BulkProductAction)} disabled={bulkBusy} className="min-w-[220px] flex-1 rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-bold">
              <option value="PUBLISH">Publish selected</option>
              <option value="MOVE_TO_DRAFT">Move to draft</option>
              <option value="FEATURE">Mark featured</option>
              <option value="UNFEATURE">Remove featured</option>
            </select>
            <button type="button" onClick={() => void applyBulkAction()} disabled={bulkBusy || busy || selectedProducts.length === 0 || selectedProducts.length > 25} className="rounded-xl bg-black px-5 py-2 text-xs font-black text-white disabled:opacity-40">{bulkBusy ? "Applying…" : "Apply bulk action"}</button>
          </div>
          <p className="text-xs font-semibold text-black/50">Only selected products are affected. Confirmation required. Archived products are excluded. If a product changes after selection, refresh before retrying.</p>
        </div>
        <div className="space-y-3">
          {visibleProducts.map((product) => (
            <div key={product.id} className="flex items-start gap-3">
              <input aria-label={"Select product " + product.name} type="checkbox" disabled={bulkBusy || product.status === "ARCHIVED" || (!selectedIds.includes(product.id) && selectedIds.length >= 25)} checked={selectedIds.includes(product.id)} onChange={(event) => setSelectedIds((current) => event.target.checked ? [...current, product.id] : current.filter((id) => id !== product.id))} className="mt-6 h-4 w-4 shrink-0 accent-black" />
              <details className="min-w-0 flex-1 rounded-[22px] border border-black/10 bg-[#fafaf7] p-4">
              <summary className="cursor-pointer list-none">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-black">{product.name}</p>
                    <p className="mt-1 text-xs font-bold text-black/40">{product.sku} · {product.category || "Uncategorized"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {product.featured ? <span className="rounded-full bg-[#d7ff47] px-2.5 py-1 text-[10px] font-black">FEATURED</span> : null}
                    {product.videoUrl ? <span className="rounded-full bg-[#d7ff47] px-2.5 py-1 text-[10px] font-black">VIDEO</span> : null}
                    <span className="rounded-full bg-black/5 px-2.5 py-1 text-[10px] font-black">{product.status}</span>
                    <span className="font-black">{money(product.priceMinor)}</span>
                  </div>
                </div>
              </summary>
              <ProductEditForm product={product} options={options}
                definitions={attributeDefinitions}
                attributesLoading={attributesLoading}
                attributeError={attributeError}
                onSave={(patch) => updateProduct(product, patch)} />
              </details>
            </div>
          ))}
          {!rows.length ? <p className="py-6 text-center text-sm font-bold text-black/35">No products yet.</p> : null}
        </div>
      </Panel>
    </div>
  );
}

function Homepage() {
  return <div className="space-y-6"><div><p className="text-xs font-black uppercase tracking-[.18em] text-black/35">Storefront CMS</p><h1 className="mt-1 text-3xl font-black tracking-[-.05em]">Homepage banners</h1><p className="mt-2 max-w-2xl text-sm font-medium text-black/50">Create and publish category-aware banners. Changes persist only when the reviewed HomepageBanner migration has been applied.</p></div><CmsHeroEditor /></div>;
}

function ProductEditForm({ product, options, definitions, attributesLoading, attributeError, onSave }: {
  product: ProductRow;
  options: CatalogOptions;
  definitions: ProductAttributeDefinition[];
  attributesLoading: boolean;
  attributeError: string;
  onSave: (patch: Record<string, unknown>) => Promise<void>;
}) {
  const [name, setName] = useState(product.name);
  const [price, setPrice] = useState(String(product.priceMinor / 100));
  const [compareAtPrice, setCompareAtPrice] = useState(product.compareAtMinor == null ? "" : String(product.compareAtMinor / 100));
  const [description, setDescription] = useState(product.description);
  const [featured, setFeatured] = useState(product.featured);
  const [videoUrl, setVideoUrl] = useState(product.videoUrl || "");
  const [posterUrl, setPosterUrl] = useState(product.posterUrl || "");
  const [categorySlug, setCategorySlug] = useState(product.categorySlug || "");
  const [brandSlug, setBrandSlug] = useState(product.brandSlug || "");
  const [status, setStatus] = useState(product.status);
  const [gallery, setGallery] = useState<string[]>(product.media.filter((item) => item.sortOrder >= 10).map((item) => item.url));
  const [busy, setBusy] = useState(false);
  const [draftError, setDraftError] = useState("");
  const [draftAttributes, setDraftAttributes] = useState<Record<string, unknown>>(
    product.attributes && !Array.isArray(product.attributes) ? product.attributes : {}
  );
  const categoryId = options.categories.find((item) => item.slug === categorySlug)?.id;
  const applicableDefinitions = activeProductAttributes(definitions, categoryId);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      setDraftError("");
      if (attributesLoading || attributeError) throw new Error("Category attributes could not be loaded.");
      const attrs = categoryId ? normalizeAttributeDraft(applicableDefinitions, draftAttributes) : undefined;
      await onSave({
        name, price: Number(price), compareAtPrice: compareAtPrice ? Number(compareAtPrice) : null,
        ...(description.trim() !== product.description.trim() ? { description } : {}), featured, videoUrl, posterUrl, status,
        ...(categorySlug !== (product.categorySlug ?? "") ? { categorySlug } : {}),
        ...(brandSlug !== (product.brandSlug ?? "") ? { brandSlug } : {}),
        ...(attrs !== undefined ? { attributes: attrs } : {}),
        images: gallery,
      });
    } catch (error) {
      setDraftError(error instanceof Error ? error.message : "Unable to save product changes.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="mt-4 grid gap-3 border-t border-black/8 pt-4 md:grid-cols-2">
      {draftError ? <p role="alert" className="rounded-xl bg-red-50 p-3 text-xs font-bold text-red-700 md:col-span-2">{draftError}</p> : null}
      <input value={name} onChange={(e) => setName(e.target.value)} className="rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm font-bold" />
      <input value={price} onChange={(e) => setPrice(e.target.value)} type="number" className="rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm font-bold" />
      <input value={compareAtPrice} onChange={(e) => setCompareAtPrice(e.target.value)} type="number" min={price} placeholder="Compare-at price (optional)" className="rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm font-bold" />
      <label className="flex items-center gap-2 rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm font-bold"><input checked={featured} onChange={(e) => setFeatured(e.target.checked)} type="checkbox" /> Featured product</label>
      <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Product description" className="md:col-span-2 rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm font-bold" />
      <select value={categorySlug} onChange={(e) => { setCategorySlug(e.target.value); setDraftAttributes({}); }} className="rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm font-bold"><option value="">Uncategorized</option>{options.categories.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}</select>
      <select value={brandSlug} onChange={(e) => setBrandSlug(e.target.value)} className="rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm font-bold"><option value="">No brand</option>{options.brands.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}</select>
      {categorySlug ? <ProductAttributeEditor
        definitions={applicableDefinitions} value={draftAttributes}
        onChange={setDraftAttributes} loading={attributesLoading}
        error={attributeError} disabled={busy}
      /> : null}
      <label className="md:col-span-2">
        <span className="mb-1 block text-[10px] font-black uppercase tracking-wide text-black/35">Product video</span>
        <input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="YouTube or HTTPS MP4/WebM URL" className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm font-bold" />
        <AdminMediaUpload resourceType="video" label="Upload new video" onUploaded={setVideoUrl} />
      </label>
      <label className="md:col-span-2">
        <span className="mb-1 block text-[10px] font-black uppercase tracking-wide text-black/35">Poster image</span>
        <input value={posterUrl} onChange={(e) => setPosterUrl(e.target.value)} placeholder="Poster image URL" className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm font-bold" />
        <AdminMediaUpload resourceType="image" label="Upload new poster" onUploaded={setPosterUrl} />
      </label>
      <ProductGalleryEditor value={gallery} onChange={setGallery} disabled={busy} />
      <ProductPreviewPanel name={name} price={price} compareAtPrice={compareAtPrice} description={description} posterUrl={posterUrl} gallery={gallery} videoUrl={videoUrl} status={status} />
      <div className="flex flex-wrap gap-2 md:col-span-2">
        <button disabled={busy || attributesLoading || Boolean(attributeError)} className="rounded-full bg-black px-4 py-2 text-xs font-black text-white">{busy ? "Saving…" : "Save changes"}</button>
        {["DRAFT", "ACTIVE", "ARCHIVED"].map((nextStatus) => (
          <button
            key={nextStatus}
            type="button"
            disabled={busy}
            onClick={() => { setBusy(true); setDraftError(""); void onSave({ status: nextStatus }).then(() => setStatus(nextStatus)).catch((error: unknown) => setDraftError(error instanceof Error ? error.message : "Status update failed.")).finally(() => setBusy(false)); }}
            className={`rounded-full px-4 py-2 text-xs font-black ${status === nextStatus ? "bg-[#d7ff47]" : "bg-black/5"}`}
          >
            {nextStatus}
          </button>
        ))}
      </div>
    </form>
  );
}

const orderStatuses = ["PENDING","CONFIRMED","PROCESSING","PACKED","SHIPPED","OUT_FOR_DELIVERY","DELIVERED","CANCELLED"];

function Orders() {
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    adminFetch<OrderRow[]>("/api/admin-app/orders").then(setRows).catch((e) => setError(e.message));
  }, []);

  useEffect(() => load(), [load]);

  async function changeStatus(order: OrderRow, status: string) {
    try {
      await adminFetch(`/api/admin-app/orders/${encodeURIComponent(order.id)}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update order.");
    }
  }

  return (
    <div className="space-y-6">
      <div><p className="text-xs font-black uppercase tracking-[.18em] text-black/35">Operations</p><h1 className="mt-1 text-3xl font-black tracking-[-.05em]">Orders</h1></div>
      {error ? <ErrorBlock error={error} retry={load} /> : null}
      <Panel title="Order management" description="Update fulfillment status from one place">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-black/35"><tr><th className="pb-3">Order</th><th className="pb-3">Customer</th><th className="pb-3">Payment</th><th className="pb-3">Items</th><th className="pb-3">Status</th><th className="pb-3 text-right">Total</th></tr></thead>
            <tbody className="divide-y divide-black/8">
              {rows.map((order) => (
                <tr key={order.id}>
                  <td className="py-4"><b>{order.orderNumber}</b><p className="text-xs text-black/40">{new Date(order.createdAt).toLocaleString("en-IN")}</p></td>
                  <td className="py-4"><b>{order.customer.name}</b><p className="text-xs text-black/40">{order.customer.email}</p></td>
                  <td className="py-4 font-black uppercase">{order.paymentMethod || "—"}<p className="text-xs text-black/40">{order.paymentStatus}</p></td>
                  <td className="py-4 font-black">{order.itemCount}</td>
                  <td className="py-4">
                    <select value={order.status} onChange={(e) => void changeStatus(order, e.target.value)} className="rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-black">
                      {orderStatuses.map((status) => <option key={status}>{status}</option>)}
                    </select>
                  </td>
                  <td className="py-4 text-right font-black">{money(order.totalMinor)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function Inventory() {
  const [rows, setRows] = useState<InventoryRow[]>([]);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    adminFetch<InventoryRow[]>("/api/admin-app/inventory").then(setRows).catch((e) => setError(e.message));
  }, []);
  useEffect(() => load(), [load]);

  async function adjust(row: InventoryRow) {
    const raw = window.prompt(`Stock adjustment for ${row.product.name}. Use positive or negative whole number.`, "1");
    if (raw === null) return;
    const delta = Number(raw);
    const note = window.prompt("Reason for adjustment:", "Owner stock update");
    if (!note) return;
    try {
      await adminFetch("/api/admin-app/inventory/adjust", {
        method: "POST",
        body: JSON.stringify({ inventoryId: row.id, delta, note }),
      });
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Stock update failed.");
    }
  }

  return (
    <div className="space-y-6">
      <div><p className="text-xs font-black uppercase tracking-[.18em] text-black/35">Stock</p><h1 className="mt-1 text-3xl font-black tracking-[-.05em]">Inventory</h1></div>
      {error ? <ErrorBlock error={error} retry={load} /> : null}
      <Panel title="Inventory" description="On-hand, reserved and available stock">
        <div className="space-y-2">
          {rows.map((row) => (
            <div key={row.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-black/8 bg-[#fafaf7] p-4">
              <div><p className="font-black">{row.product.name}</p><p className="text-xs font-bold text-black/40">{row.product.sku} · {row.warehouse.name}</p></div>
              <div className="flex items-center gap-4 text-xs font-black">
                <span>On hand {row.onHand}</span><span>Reserved {row.reserved}</span>
                <span className={row.lowStock ? "text-red-700" : "text-emerald-700"}>Available {row.available}</span>
                <button onClick={() => void adjust(row)} className="rounded-full bg-black px-3 py-2 text-white">Adjust</button>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function Coupons() {
  const [rows, setRows] = useState<CouponRow[]>([]);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ code: "", kind: "PERCENT", value: "10", minSubtotal: "0", maxDiscount: "" });

  const load = useCallback(() => {
    adminFetch<CouponRow[]>("/api/admin-app/coupons").then(setRows).catch((e) => setError(e.message));
  }, []);
  useEffect(() => load(), [load]);

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await adminFetch("/api/admin-app/coupons", {
        method: "POST",
        body: JSON.stringify({
          code: form.code,
          kind: form.kind,
          value: Number(form.value),
          minSubtotal: Number(form.minSubtotal),
          maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : undefined,
        }),
      });
      setForm({ code: "", kind: "PERCENT", value: "10", minSubtotal: "0", maxDiscount: "" });
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create coupon.");
    }
  }

  async function toggle(row: CouponRow) {
    try {
      await adminFetch("/api/admin-app/coupons", {
        method: "PATCH",
        body: JSON.stringify({ id: row.id, active: !row.active }),
      });
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update coupon.");
    }
  }

  return (
    <div className="space-y-6">
      <div><p className="text-xs font-black uppercase tracking-[.18em] text-black/35">Promotions</p><h1 className="mt-1 text-3xl font-black tracking-[-.05em]">Coupons</h1></div>
      {error ? <ErrorBlock error={error} retry={load} /> : null}
      <Panel title="Create coupon">
        <form onSubmit={create} className="grid gap-3 md:grid-cols-5">
          <input value={form.code} onChange={(e)=>setForm({...form,code:e.target.value.toUpperCase()})} placeholder="CODE" className="rounded-xl border border-black/10 px-3 py-2.5 font-black" />
          <select value={form.kind} onChange={(e)=>setForm({...form,kind:e.target.value})} className="rounded-xl border border-black/10 px-3 py-2.5 font-bold"><option>PERCENT</option><option>FLAT</option></select>
          <input value={form.value} onChange={(e)=>setForm({...form,value:e.target.value})} type="number" placeholder="Value" className="rounded-xl border border-black/10 px-3 py-2.5 font-bold" />
          <input value={form.minSubtotal} onChange={(e)=>setForm({...form,minSubtotal:e.target.value})} type="number" placeholder="Min cart ₹" className="rounded-xl border border-black/10 px-3 py-2.5 font-bold" />
          <button className="rounded-full bg-black px-4 py-2.5 text-xs font-black text-white">Create</button>
          <input value={form.maxDiscount} onChange={(e)=>setForm({...form,maxDiscount:e.target.value})} type="number" placeholder="Max discount ₹ (optional)" className="rounded-xl border border-black/10 px-3 py-2.5 font-bold md:col-span-2" />
        </form>
      </Panel>
      <Panel title="Coupons" description={`${rows.length} coupon codes`}>
        <div className="space-y-2">
          {rows.map((row) => (
            <div key={row.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-black/8 bg-[#fafaf7] p-4">
              <div><p className="font-black">{row.code}</p><p className="text-xs font-bold text-black/40">{row.kind} · value {row.value} · used {row.usageCount ?? 0}</p></div>
              <button onClick={() => void toggle(row)} className={`rounded-full px-4 py-2 text-xs font-black ${row.active ? "bg-[#d7ff47]" : "bg-black/5"}`}>{row.active ? "Active" : "Disabled"}</button>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function Returns() {
  const [rows, setRows] = useState<ReturnRow[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(() => {
    adminFetch<ReturnRow[]>("/api/admin-app/returns")
      .then(setRows)
      .catch((e) => setError(e.message));
  }, []);
  useEffect(() => load(), [load]);

  function explainRefund(result?: RefundActionResult | null) {
    if (!result) return "";
    const detail = result.message ? ` — ${result.message}` : "";
    if (result.state === "SUCCESS") return `Refund confirmed${detail}`;
    if (result.state === "PENDING" || result.state === "ONHOLD") {
      return `Refund ${result.state.toLowerCase()}; use Sync refund later${detail}`;
    }
    if (result.state === "MANUAL_REQUIRED") return `Manual refund required${detail}`;
    if (result.state === "NOT_CONFIGURED") return `Cashfree setup required${detail}`;
    if (result.state === "NOT_REQUIRED") return `No refund required${detail}`;
    return `Refund state: ${result.state}${detail}`;
  }

  async function process(row: ReturnRow, status: "APPROVED" | "REJECTED") {
    const refund =
      status === "APPROVED"
        ? Number(
            window.prompt(
              "Refund amount in ₹:",
              String((row.refundMinor || 0) / 100),
            ) || "0",
          )
        : 0;
    const note =
      window.prompt(
        "Resolution note:",
        status === "APPROVED"
          ? "Approved by owner"
          : "Rejected by owner",
      ) || "";

    setError("");
    setNotice("");

    try {
      const result = await adminFetch<{
        refund?: RefundActionResult | null;
      }>(
        `/api/admin-app/returns/${encodeURIComponent(row.id)}/process`,
        {
          method: "POST",
          body: JSON.stringify({
            status,
            refund,
            note,
            restock: status === "APPROVED",
          }),
        },
      );

      const refundText = explainRefund(result.refund);
      setNotice(
        `Return ${status.toLowerCase()}.${refundText ? ` ${refundText}.` : ""}`,
      );
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Return update failed.");
    }
  }

  async function syncRefund(row: ReturnRow) {
    setError("");
    setNotice("");

    try {
      const result = await adminFetch<RefundActionResult>(
        `/api/admin-app/returns/${encodeURIComponent(row.id)}/refund`,
        { method: "POST" },
      );
      setNotice(explainRefund(result));
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Refund sync failed.");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-black uppercase tracking-[.18em] text-black/35">
          After sales
        </p>
        <h1 className="mt-1 text-3xl font-black tracking-[-.05em]">
          Returns & refunds
        </h1>
      </div>

      {error ? <ErrorBlock error={error} retry={load} /> : null}
      {notice ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-800">
          {notice}
        </div>
      ) : null}

      <Panel title="Return requests">
        <div className="space-y-3">
          {rows.map((row) => {
            const approvedRefund = row.refundMinor || 0;
            const canSync =
              row.status === "APPROVED" &&
              approvedRefund > 0 &&
              row.paymentMethod === "cashfree" &&
              !row.refundProcessedAt;

            return (
              <div
                key={row.id}
                className="rounded-2xl border border-black/8 bg-[#fafaf7] p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-black">{row.orderNumber}</p>
                    <p className="mt-1 text-sm font-bold">{row.reason}</p>
                    <p className="text-xs text-black/40">
                      {row.customerName} · {row.customerEmail}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-black/5 px-3 py-1 text-xs font-black">
                      {row.status || "PENDING"}
                    </span>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-black">
                      {(row.paymentMethod || "unknown").toUpperCase()} ·{" "}
                      {row.paymentStatus || "PENDING"}
                    </span>
                    {row.refundProcessedAt ? (
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-800">
                        REFUND CONFIRMED
                      </span>
                    ) : null}
                  </div>
                </div>

                {approvedRefund > 0 ? (
                  <div className="mt-3 rounded-xl bg-white px-3 py-2 text-xs font-bold text-black/55">
                    Approved refund: {money(approvedRefund)}
                    {row.restockedAt ? " · Stock restored" : ""}
                  </div>
                ) : null}

                <div className="mt-4 flex flex-wrap gap-2">
                  {(!row.status || row.status === "PENDING") ? (
                    <>
                      <button
                        onClick={() => void process(row, "APPROVED")}
                        className="rounded-full bg-[#d7ff47] px-4 py-2 text-xs font-black"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => void process(row, "REJECTED")}
                        className="rounded-full bg-black px-4 py-2 text-xs font-black text-white"
                      >
                        Reject
                      </button>
                    </>
                  ) : null}

                  {canSync ? (
                    <button
                      onClick={() => void syncRefund(row)}
                      className="rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-black"
                    >
                      Sync Cashfree refund
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}

          {!rows.length ? (
            <p className="py-6 text-center text-sm font-bold text-black/35">
              No return requests.
            </p>
          ) : null}
        </div>
      </Panel>
    </div>
  );
}

function Notifications() {
  const [rows, setRows] = useState<NotificationRow[]>([]);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    adminFetch<NotificationRow[]>("/api/admin-app/notifications")
      .then(setRows)
      .catch((caught) =>
        setError(
          caught instanceof Error
            ? caught.message
            : "Could not load notifications.",
        ),
      );
  }, []);

  useEffect(() => load(), [load]);

  async function markRead(row: NotificationRow) {
    if (row.readAt) return;

    try {
      await adminFetch("/api/admin-app/notifications", {
        method: "PATCH",
        body: JSON.stringify({ id: row.id }),
      });
      setRows((current) =>
        current.map((item) =>
          item.id === row.id
            ? { ...item, readAt: new Date().toISOString() }
            : item,
        ),
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not update notification.",
      );
    }
  }

  const unread = rows.filter((row) => !row.readAt).length;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-black uppercase tracking-[.18em] text-black/35">Owner alerts</p>
        <h1 className="mt-1 text-3xl font-black tracking-[-.05em]">Notifications</h1>
      </div>

      {error ? <ErrorBlock error={error} retry={load} /> : null}

      <Panel
        title="Store alerts"
        description={`${unread} unread · ${rows.length} recent alerts`}
        action={
          <button
            type="button"
            onClick={load}
            className="rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-black"
          >
            Refresh
          </button>
        }
      >
        <div className="space-y-2">
          {rows.map((row) => {
            const severity = (row.severity || "INFO").toUpperCase();
            const badge =
              severity === "CRITICAL"
                ? "bg-red-100 text-red-800"
                : severity === "WARNING"
                  ? "bg-amber-100 text-amber-800"
                  : severity === "SUCCESS"
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-black/5 text-black/55";

            return (
              <button
                key={row.id}
                type="button"
                onClick={() => void markRead(row)}
                className={`w-full rounded-2xl border p-4 text-left transition ${
                  row.readAt
                    ? "border-black/8 bg-[#fafaf7] opacity-70"
                    : "border-black/15 bg-white shadow-sm"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {!row.readAt ? (
                        <span className="h-2 w-2 rounded-full bg-[#9bbc00]" />
                      ) : null}
                      <p className="font-black">{row.title}</p>
                      <span className={`rounded-full px-2 py-1 text-[9px] font-black uppercase tracking-wide ${badge}`}>
                        {severity}
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-bold leading-5 text-black/50">
                      {row.message}
                    </p>
                    <p className="mt-2 text-[11px] font-bold text-black/30">
                      {row.type} · {new Date(row.createdAt).toLocaleString("en-IN")}
                    </p>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wide text-black/35">
                    {row.readAt ? "Read" : "Tap to mark read"}
                  </span>
                </div>
              </button>
            );
          })}

          {!rows.length ? (
            <p className="py-8 text-center text-sm font-bold text-black/35">
              No notifications right now.
            </p>
          ) : null}
        </div>
      </Panel>
    </div>
  );
}

function Settings({ me }: { me: AdminMe }) {
  const [status, setStatus] = useState<IntegrationStatus | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    adminFetch<IntegrationStatus>("/api/admin-app/settings")
      .then(setStatus)
      .catch((caught) =>
        setError(
          caught instanceof Error
            ? caught.message
            : "Could not load integration status.",
        ),
      );
  }, []);

  useEffect(() => load(), [load]);

  const integrations = status
    ? [
        {
          name: "Cashfree",
          ready: status.integrations.cashfree.configured,
          detail: status.integrations.cashfree.configured
            ? `${status.integrations.cashfree.mode} · storefront ${
                status.integrations.cashfree.storefrontEnabled
                  ? "enabled"
                  : "disabled"
              }`
            : "API keys required",
        },
        {
          name: "Cloudinary",
          ready: status.integrations.cloudinary.configured,
          detail: status.integrations.cloudinary.configured
            ? "Direct image/video uploads ready"
            : "Cloud name + API credentials required",
        },
        {
          name: "Order email",
          ready: status.integrations.email.configured,
          detail: status.integrations.email.configured
            ? `${status.integrations.email.provider} ready`
            : "RESEND_API_KEY + ORDER_EMAIL_FROM required",
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-black uppercase tracking-[.18em] text-black/35">Private owner mode</p>
        <h1 className="mt-1 text-3xl font-black tracking-[-.05em]">Settings</h1>
      </div>

      {error ? <ErrorBlock error={error} retry={load} /> : null}

      <Panel title="Owner access" description="Separate from customer authentication">
        <dl className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-[#f5f5f1] p-4">
            <dt className="text-xs font-black uppercase text-black/35">Signed in as</dt>
            <dd className="mt-1 font-black">{me.user.name}</dd>
          </div>
          <div className="rounded-2xl bg-[#f5f5f1] p-4">
            <dt className="text-xs font-black uppercase text-black/35">Session expires</dt>
            <dd className="mt-1 font-black">{new Date(me.expiresAt).toLocaleString("en-IN")}</dd>
          </div>
        </dl>
      </Panel>

      <Panel title="Store identity" description="Public contact and business details">
        {!status ? (
          <p className="text-sm font-bold text-black/40">Loading store profile…</p>
        ) : (
          <div className="rounded-2xl border border-black/8 bg-[#fafaf7] p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="font-black">Business contact profile</p>
              <span
                className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-wide ${
                  status.storeProfile.configured
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {status.storeProfile.configured ? "Ready" : "Needs setup"}
              </span>
            </div>
            <p className="mt-2 text-xs font-bold leading-5 text-black/45">
              {status.storeProfile.configured
                ? "Support email, phone and business address are configured."
                : `Missing: ${status.storeProfile.missing.join(", ")}`}
            </p>
          </div>
        )}
      </Panel>

      <Panel title="Integrations" description="Secrets are never shown in the browser">
        {!status ? (
          <p className="text-sm font-bold text-black/40">Loading integration status…</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-3">
            {integrations.map((integration) => (
              <div
                key={integration.name}
                className="rounded-2xl border border-black/8 bg-[#fafaf7] p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-black">{integration.name}</p>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-wide ${
                      integration.ready
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {integration.ready ? "Ready" : "Needs setup"}
                  </span>
                </div>
                <p className="mt-2 text-xs font-bold leading-5 text-black/45">
                  {integration.detail}
                </p>
              </div>
            ))}
          </div>
        )}

        {status ? (
          <div className="mt-4 rounded-2xl bg-[#f5f5f1] p-4 text-xs font-bold leading-5 text-black/50">
            Environment: <b>{status.deployment.environment}</b> · App URL:{" "}
            <b>{status.deployment.appUrl}</b>
          </div>
        ) : null}
      </Panel>
    </div>
  );
}

export function PersonalAdminApp() {
  const pathname = usePathname();
  const router = useRouter();
  const [me, setMe] = useState<AdminMe | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;
    adminFetch<AdminMe>("/api/admin-app/auth/me")
      .then((data) => {
        if (active) setMe(data);
      })
      .catch(() => {
        if (active) router.replace("/admin/login");
      })
      .finally(() => {
        if (active) setChecking(false);
      });
    return () => { active = false; };
  }, [router]);

  const section = useMemo(() => {
    if (pathname.startsWith("/admin/products")) return <Products />;
    if (pathname.startsWith("/admin/catalog")) return <CatalogManagement />;
    if (pathname.startsWith("/admin/homepage")) return <Homepage />;
    if (pathname.startsWith("/admin/orders")) return <Orders />;
    if (pathname.startsWith("/admin/inventory")) return <Inventory />;
    if (pathname.startsWith("/admin/coupons")) return <Coupons />;
    if (pathname.startsWith("/admin/returns")) return <Returns />;
    if (pathname.startsWith("/admin/notifications")) return <Notifications />;
    if (pathname.startsWith("/admin/settings")) return me ? <Settings me={me} /> : null;
    return <Overview />;
  }, [pathname, me]);

  if (checking || !me) {
    return <main className="grid min-h-screen place-items-center bg-[#f5f5f1] text-sm font-black text-black/45">Checking private owner session…</main>;
  }

  return <AdminShell>{section}</AdminShell>;
}
