"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";

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
  priceMinor: number;
  status: string;
  brand: string | null;
  category: string | null;
  onHand: number;
  reserved: number;
  videoUrl: string | null;
  posterUrl: string | null;
  updatedAt: string;
};

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
  createdAt?: string;
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
  const [form, setForm] = useState({
    name: "", sku: "", price: "", description: "", videoUrl: "", posterUrl: "",
  });

  const load = useCallback(() => {
    adminFetch<ProductRow[]>("/api/admin-app/products").then(setRows).catch((e) => setError(e.message));
  }, []);

  useEffect(() => load(), [load]);

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await adminFetch("/api/admin-app/products/manage", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          price: Number(form.price),
          status: "DRAFT",
        }),
      });
      setForm({ name: "", sku: "", price: "", description: "", videoUrl: "", posterUrl: "" });
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
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-black uppercase tracking-[.18em] text-black/35">Catalog</p>
        <h1 className="mt-1 text-3xl font-black tracking-[-.05em]">Products</h1>
      </div>

      {error ? <ErrorBlock error={error} retry={load} /> : null}

      <Panel title="Add product" description="Create a draft product with optional product video">
        <form onSubmit={create} className="grid gap-3 md:grid-cols-2">
          {[
            ["name", "Product name", "Gift product"],
            ["sku", "SKU", "NX-GIFT-001"],
            ["price", "Price (₹)", "999"],
            ["videoUrl", "Video URL", "YouTube or HTTPS MP4/WebM"],
            ["posterUrl", "Poster image URL", "Cloudinary / Supabase / YouTube / Unsplash"],
          ].map(([key, label, placeholder]) => (
            <label key={key} className={key === "posterUrl" || key === "videoUrl" ? "md:col-span-2" : ""}>
              <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-black/40">{label}</span>
              <input
                value={form[key as keyof typeof form]}
                onChange={(e) => setForm((current) => ({ ...current, [key]: e.target.value }))}
                placeholder={placeholder}
                type={key === "price" ? "number" : key.includes("Url") ? "url" : "text"}
                className="w-full rounded-2xl border border-black/10 bg-[#f7f7f3] px-4 py-3 text-sm font-bold outline-none focus:border-black"
              />
            </label>
          ))}
          <label className="md:col-span-2">
            <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-black/40">Description</span>
            <textarea
              value={form.description}
              onChange={(e) => setForm((current) => ({ ...current, description: e.target.value }))}
              rows={4}
              className="w-full rounded-2xl border border-black/10 bg-[#f7f7f3] px-4 py-3 text-sm font-bold outline-none focus:border-black"
            />
          </label>
          <button disabled={busy} className="rounded-full bg-black px-5 py-3 text-sm font-black text-white md:col-span-2 disabled:opacity-50">
            {busy ? "Creating…" : "Create draft product"}
          </button>
        </form>
      </Panel>

      <Panel title="All products" description={`${rows.length} products in database`}>
        <div className="space-y-3">
          {rows.map((product) => (
            <details key={product.id} className="rounded-[22px] border border-black/10 bg-[#fafaf7] p-4">
              <summary className="cursor-pointer list-none">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-black">{product.name}</p>
                    <p className="mt-1 text-xs font-bold text-black/40">{product.sku} · {product.category || "Uncategorized"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {product.videoUrl ? <span className="rounded-full bg-[#d7ff47] px-2.5 py-1 text-[10px] font-black">VIDEO</span> : null}
                    <span className="rounded-full bg-black/5 px-2.5 py-1 text-[10px] font-black">{product.status}</span>
                    <span className="font-black">{money(product.priceMinor)}</span>
                  </div>
                </div>
              </summary>
              <ProductEditForm product={product} onSave={(patch) => updateProduct(product, patch)} />
            </details>
          ))}
          {!rows.length ? <p className="py-6 text-center text-sm font-bold text-black/35">No products yet.</p> : null}
        </div>
      </Panel>
    </div>
  );
}

function ProductEditForm({ product, onSave }: { product: ProductRow; onSave: (patch: Record<string, unknown>) => Promise<void> }) {
  const [name, setName] = useState(product.name);
  const [price, setPrice] = useState(String(product.priceMinor / 100));
  const [videoUrl, setVideoUrl] = useState(product.videoUrl || "");
  const [posterUrl, setPosterUrl] = useState(product.posterUrl || "");
  const [busy, setBusy] = useState(false);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      await onSave({ name, price: Number(price), videoUrl, posterUrl });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="mt-4 grid gap-3 border-t border-black/8 pt-4 md:grid-cols-2">
      <input value={name} onChange={(e) => setName(e.target.value)} className="rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm font-bold" />
      <input value={price} onChange={(e) => setPrice(e.target.value)} type="number" className="rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm font-bold" />
      <input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="Product video URL" className="rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm font-bold md:col-span-2" />
      <input value={posterUrl} onChange={(e) => setPosterUrl(e.target.value)} placeholder="Poster image URL" className="rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm font-bold md:col-span-2" />
      <div className="flex flex-wrap gap-2 md:col-span-2">
        <button disabled={busy} className="rounded-full bg-black px-4 py-2 text-xs font-black text-white">{busy ? "Saving…" : "Save changes"}</button>
        {["DRAFT", "ACTIVE", "ARCHIVED"].map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => void onSave({ status })}
            className={`rounded-full px-4 py-2 text-xs font-black ${product.status === status ? "bg-[#d7ff47]" : "bg-black/5"}`}
          >
            {status}
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

  const load = useCallback(() => {
    adminFetch<ReturnRow[]>("/api/admin-app/returns").then(setRows).catch((e) => setError(e.message));
  }, []);
  useEffect(() => load(), [load]);

  async function process(row: ReturnRow, status: "APPROVED" | "REJECTED") {
    const refund = status === "APPROVED" ? Number(window.prompt("Refund amount in ₹:", String((row.refundMinor || 0) / 100)) || "0") : 0;
    const note = window.prompt("Resolution note:", status === "APPROVED" ? "Approved by owner" : "Rejected by owner") || "";
    try {
      await adminFetch(`/api/admin-app/returns/${encodeURIComponent(row.id)}/process`, {
        method: "POST",
        body: JSON.stringify({ status, refund, note, restock: status === "APPROVED" }),
      });
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Return update failed.");
    }
  }

  return (
    <div className="space-y-6">
      <div><p className="text-xs font-black uppercase tracking-[.18em] text-black/35">After sales</p><h1 className="mt-1 text-3xl font-black tracking-[-.05em]">Returns</h1></div>
      {error ? <ErrorBlock error={error} retry={load} /> : null}
      <Panel title="Return requests">
        <div className="space-y-3">
          {rows.map((row) => (
            <div key={row.id} className="rounded-2xl border border-black/8 bg-[#fafaf7] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><p className="font-black">{row.orderNumber}</p><p className="mt-1 text-sm font-bold">{row.reason}</p><p className="text-xs text-black/40">{row.customerName} · {row.customerEmail}</p></div>
                <span className="rounded-full bg-black/5 px-3 py-1 text-xs font-black">{row.status || "PENDING"}</span>
              </div>
              <div className="mt-4 flex gap-2">
                <button onClick={() => void process(row, "APPROVED")} className="rounded-full bg-[#d7ff47] px-4 py-2 text-xs font-black">Approve</button>
                <button onClick={() => void process(row, "REJECTED")} className="rounded-full bg-black px-4 py-2 text-xs font-black text-white">Reject</button>
              </div>
            </div>
          ))}
          {!rows.length ? <p className="py-6 text-center text-sm font-bold text-black/35">No return requests.</p> : null}
        </div>
      </Panel>
    </div>
  );
}

function Settings({ me }: { me: AdminMe }) {
  return (
    <div className="space-y-6">
      <div><p className="text-xs font-black uppercase tracking-[.18em] text-black/35">Private owner mode</p><h1 className="mt-1 text-3xl font-black tracking-[-.05em]">Settings</h1></div>
      <Panel title="Owner access" description="Separate from customer authentication">
        <dl className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-[#f5f5f1] p-4"><dt className="text-xs font-black uppercase text-black/35">Signed in as</dt><dd className="mt-1 font-black">{me.user.name}</dd></div>
          <div className="rounded-2xl bg-[#f5f5f1] p-4"><dt className="text-xs font-black uppercase text-black/35">Session expires</dt><dd className="mt-1 font-black">{new Date(me.expiresAt).toLocaleString("en-IN")}</dd></div>
        </dl>
        <div className="mt-5 rounded-2xl border border-black/10 bg-white p-4 text-sm leading-6 text-black/60">
          Set <b>ADMIN_USERNAME</b> and <b>ADMIN_PASSWORD</b> in local/Vercel environment variables. Optional: <b>ADMIN_OWNER_EMAIL</b>. The password is never sent back to the browser after login.
        </div>
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
    if (pathname.startsWith("/admin/orders")) return <Orders />;
    if (pathname.startsWith("/admin/inventory")) return <Inventory />;
    if (pathname.startsWith("/admin/coupons")) return <Coupons />;
    if (pathname.startsWith("/admin/returns")) return <Returns />;
    if (pathname.startsWith("/admin/settings")) return me ? <Settings me={me} /> : null;
    return <Overview />;
  }, [pathname, me]);

  if (checking || !me) {
    return <main className="grid min-h-screen place-items-center bg-[#f5f5f1] text-sm font-black text-black/45">Checking private owner session…</main>;
  }

  return <AdminShell>{section}</AdminShell>;
}
