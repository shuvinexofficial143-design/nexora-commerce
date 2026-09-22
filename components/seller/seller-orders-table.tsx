"use client";

import { useMemo, useState } from "react";
import type { SellerOrder } from "@/types/seller";

const money = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

export function SellerOrdersTable({ orders }: { orders: SellerOrder[] }) {
  const [status, setStatus] = useState("All");
  const rows = useMemo(
    () => orders.filter((order) => status === "All" || order.status === status),
    [orders, status],
  );

  return (
    <section className="rounded-[28px] border border-black/10 bg-white p-4 sm:p-5">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black">Seller orders</h2>
          <p className="text-sm text-black/50">
            Real customer orders containing this seller&apos;s products.
          </p>
        </div>

        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="rounded-2xl border border-black/10 bg-[#f7f7f3] px-4 py-2.5 text-sm font-bold"
        >
          <option>All</option>
          <option>New</option>
          <option>Processing</option>
          <option>Packed</option>
          <option>Shipped</option>
          <option>Delivered</option>
          <option>Returned</option>
          <option>Refunded</option>
          <option>Cancelled</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-black/40">
            <tr>
              <th className="pb-3">Order</th>
              <th className="pb-3">Customer</th>
              <th className="pb-3">Products</th>
              <th className="pb-3">Seller amount</th>
              <th className="pb-3">Placed</th>
              <th className="pb-3">Status</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((order) => (
              <tr key={order.id} className="border-t border-black/8">
                <td className="py-4 font-black">{order.id}</td>
                <td className="py-4 font-bold">{order.customer}</td>
                <td className="py-4">
                  <p className="max-w-sm font-bold">{order.product}</p>
                  <p className="text-xs text-black/40">Qty {order.quantity}</p>
                </td>
                <td className="py-4 font-black">{money(order.amount)}</td>
                <td className="py-4 text-black/60">{order.placed}</td>
                <td className="py-4">
                  <span className="rounded-full bg-[#eff7ff] px-2.5 py-1 text-xs font-black">
                    {order.status}
                  </span>
                </td>
              </tr>
            ))}

            {!rows.length ? (
              <tr>
                <td colSpan={6} className="border-t border-black/8 py-12 text-center">
                  <p className="text-lg font-black">No seller orders found.</p>
                  <p className="mt-2 text-sm font-bold text-black/45">
                    Orders will appear after customers purchase seller-owned products.
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
