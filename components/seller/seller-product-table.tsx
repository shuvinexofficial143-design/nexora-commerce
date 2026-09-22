"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { SellerProduct } from "@/types/seller";

const money = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

export function SellerProductTable({ products }: { products: SellerProduct[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");

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

  return (
    <section className="rounded-[28px] border border-black/10 bg-white p-4 sm:p-5">
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-black">Product catalogue</h2>
          <p className="text-sm text-black/50">
            Database-backed seller-owned listings, inventory and sales.
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

      <div className="overflow-x-auto">
        <table className="w-full min-w-[780px] text-left text-sm">
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
            {rows.map((product) => (
              <tr key={product.id} className="border-t border-black/8">
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
                  {product.status === "Live" && product.slug ? (
                    <Link
                      href={`/product/${product.slug}`}
                      className="rounded-full border border-black/10 px-3 py-2 text-xs font-black"
                    >
                      View
                    </Link>
                  ) : (
                    <span className="rounded-full border border-black/10 px-3 py-2 text-xs font-black text-black/40">
                      {product.status}
                    </span>
                  )}
                </td>
              </tr>
            ))}

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
