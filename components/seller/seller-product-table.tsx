"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  adjustMySellerProductStock,
  updateMySellerProduct,
} from "@/lib/api/seller-products-client";
import type { SellerProduct } from "@/types/seller";

const money = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

export function SellerProductTable({ products }: { products: SellerProduct[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState({ name: "", price: "" });
  const [stockDelta, setStockDelta] = useState("1");

  const rows = useMemo(
    () =>
      products.filter(
        (product) =>
          (status === "All" || product.status === status) &&
          `${product.name} ${product.sku}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [products, query, status],
  );

  function beginEdit(product: SellerProduct) {
    setEditingId(product.id);
    setDraft({ name: product.name, price: String(product.price) });
    setStockDelta("1");
    setError("");
  }

  async function saveProduct(product: SellerProduct) {
    if (busyId) return;
    setBusyId(product.id);
    setError("");

    try {
      await updateMySellerProduct(product.id, {
        name: draft.name,
        price: Number(draft.price),
      });
      setEditingId(null);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save product.");
    } finally {
      setBusyId(null);
    }
  }

  async function changeStatus(product: SellerProduct) {
    if (busyId) return;
    setBusyId(product.id);
    setError("");

    const nextStatus =
      product.status === "Live" ? "Paused" : "Live";

    try {
      await updateMySellerProduct(product.id, { status: nextStatus });
      setEditingId(null);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update listing status.");
    } finally {
      setBusyId(null);
    }
  }

  async function adjustStock(product: SellerProduct, direction: 1 | -1) {
    if (busyId) return;

    const amount = Number(stockDelta);
    if (!Number.isInteger(amount) || amount <= 0) {
      setError("Enter a positive whole-number stock adjustment.");
      return;
    }

    setBusyId(product.id);
    setError("");

    try {
      await adjustMySellerProductStock(product.id, amount * direction);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update stock.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="rounded-[28px] border border-black/10 bg-white p-4 sm:p-5">
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-black">Product catalogue</h2>
          <p className="text-sm text-black/50">
            Edit seller-owned listings, publish safely and adjust inventory.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search products or SKU"
            className="rounded-2xl border border-black/10 bg-[#f7f7f3] px-4 py-2.5 text-sm outline-none"
          />
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="rounded-2xl border border-black/10 bg-[#f7f7f3] px-4 py-2.5 text-sm font-bold"
          >
            <option>All</option>
            <option>Live</option>
            <option>Draft</option>
            <option>Paused</option>
          </select>
        </div>
      </div>

      {error ? (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-800">
          {error}
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-black/40">
            <tr>
              <th className="pb-3">Product</th>
              <th className="pb-3">Price</th>
              <th className="pb-3">Stock</th>
              <th className="pb-3">Sold</th>
              <th className="pb-3">Rating</th>
              <th className="pb-3">Status</th>
              <th className="pb-3">Action</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((product) => {
              const editing = editingId === product.id;
              const busy = busyId === product.id;

              return (
                <FragmentRow
                  key={product.id}
                  product={product}
                  editing={editing}
                  busy={busy}
                  draft={draft}
                  stockDelta={stockDelta}
                  onBeginEdit={() => beginEdit(product)}
                  onCancel={() => setEditingId(null)}
                  onDraft={setDraft}
                  onStockDelta={setStockDelta}
                  onSave={() => void saveProduct(product)}
                  onStatus={() => void changeStatus(product)}
                  onAddStock={() => void adjustStock(product, 1)}
                  onRemoveStock={() => void adjustStock(product, -1)}
                />
              );
            })}

            {!rows.length ? (
              <tr>
                <td colSpan={7} className="border-t border-black/8 py-12 text-center">
                  <p className="text-lg font-black">
                    {products.length ? "No products match this filter." : "No seller products yet."}
                  </p>
                  <p className="mt-2 text-sm font-bold text-black/45">
                    {products.length
                      ? "Try a different search or status."
                      : "Create your first draft product from the button above."}
                  </p>
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function FragmentRow({
  product,
  editing,
  busy,
  draft,
  stockDelta,
  onBeginEdit,
  onCancel,
  onDraft,
  onStockDelta,
  onSave,
  onStatus,
  onAddStock,
  onRemoveStock,
}: {
  product: SellerProduct;
  editing: boolean;
  busy: boolean;
  draft: { name: string; price: string };
  stockDelta: string;
  onBeginEdit: () => void;
  onCancel: () => void;
  onDraft: (value: { name: string; price: string }) => void;
  onStockDelta: (value: string) => void;
  onSave: () => void;
  onStatus: () => void;
  onAddStock: () => void;
  onRemoveStock: () => void;
}) {
  return (
    <>
      <tr className="border-t border-black/8">
        <td className="py-4">
          <p className="font-black">{product.name}</p>
          <p className="text-xs text-black/40">
            {product.sku} · {product.category}
          </p>
        </td>
        <td className="py-4 font-bold">{money(product.price)}</td>
        <td className="py-4">
          <span className={product.stock < 10 ? "font-black text-red-600" : "font-bold"}>
            {product.stock}
          </span>
        </td>
        <td className="py-4 font-bold">{product.sold}</td>
        <td className="py-4 font-bold">
          {product.rating ? product.rating.toFixed(1) : "—"}
        </td>
        <td className="py-4">
          <span className="rounded-full bg-black/5 px-2.5 py-1 text-xs font-black">
            {product.status}
          </span>
        </td>
        <td className="py-4">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onBeginEdit}
              className="rounded-full border border-black/10 px-3 py-2 text-xs font-black"
            >
              Edit
            </button>
            {product.status === "Live" && product.slug ? (
              <Link
                href={`/product/${product.slug}`}
                className="rounded-full border border-black/10 px-3 py-2 text-xs font-black"
              >
                View
              </Link>
            ) : null}
          </div>
        </td>
      </tr>

      {editing ? (
        <tr className="bg-[#fafaf7]">
          <td colSpan={7} className="px-3 py-4">
            <div className="grid gap-3 lg:grid-cols-[1.3fr_.7fr_auto_auto] lg:items-end">
              <label>
                <span className="mb-1 block text-xs font-black uppercase text-black/40">
                  Product name
                </span>
                <input
                  value={draft.name}
                  onChange={(event) => onDraft({ ...draft, name: event.target.value })}
                  className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 font-bold"
                />
              </label>

              <label>
                <span className="mb-1 block text-xs font-black uppercase text-black/40">
                  Price
                </span>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={draft.price}
                  onChange={(event) => onDraft({ ...draft, price: event.target.value })}
                  className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 font-bold"
                />
              </label>

              <div>
                <span className="mb-1 block text-xs font-black uppercase text-black/40">
                  Stock adjustment
                </span>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={stockDelta}
                    onChange={(event) => onStockDelta(event.target.value)}
                    className="w-20 rounded-xl border border-black/10 bg-white px-3 py-2.5 font-bold"
                  />
                  <button
                    type="button"
                    disabled={busy}
                    onClick={onAddStock}
                    className="rounded-xl border border-black/10 bg-white px-3 py-2.5 text-xs font-black disabled:opacity-50"
                  >
                    + Stock
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={onRemoveStock}
                    className="rounded-xl border border-black/10 bg-white px-3 py-2.5 text-xs font-black disabled:opacity-50"
                  >
                    − Stock
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={onSave}
                  className="rounded-full bg-black px-4 py-2.5 text-xs font-black text-white disabled:opacity-50"
                >
                  {busy ? "Saving…" : "Save"}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={onStatus}
                  className="rounded-full border border-black/10 bg-white px-4 py-2.5 text-xs font-black disabled:opacity-50"
                >
                  {product.status === "Live" ? "Pause listing" : "Publish"}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={onCancel}
                  className="rounded-full px-3 py-2.5 text-xs font-black text-black/45"
                >
                  Close
                </button>
              </div>
            </div>
          </td>
        </tr>
      ) : null}
    </>
  );
}
