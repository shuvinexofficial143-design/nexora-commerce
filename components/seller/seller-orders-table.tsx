"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { advanceMySellerOrder } from "@/lib/api/seller-orders-client";
import type { SellerOrder, SellerOrderStatus } from "@/types/seller";

const money = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

function nextSellerStatus(status: SellerOrderStatus) {
  if (status === "New") {
    return { status: "Processing" as const, label: "Start processing" };
  }
  if (status === "Processing") {
    return { status: "Packed" as const, label: "Mark packed" };
  }
  if (status === "Packed") {
    return { status: "Shipped" as const, label: "Mark shipped" };
  }
  return null;
}

export function SellerOrdersTable({ orders }: { orders: SellerOrder[] }) {
  const router = useRouter();
  const [status, setStatus] = useState("All");
  const [busyOrder, setBusyOrder] = useState<string | null>(null);
  const [error, setError] = useState("");

  const rows = useMemo(
    () => orders.filter((order) => status === "All" || order.status === status),
    [orders, status],
  );

  async function advance(order: SellerOrder) {
    const next = nextSellerStatus(order.status);
    if (!next || busyOrder) return;

    setBusyOrder(order.id);
    setError("");

    try {
      await advanceMySellerOrder(order.id, next.status);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update seller order.");
    } finally {
      setBusyOrder(null);
    }
  }

  return (
    <section className="rounded-[28px] border border-black/10 bg-white p-4 sm:p-5">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black">Seller orders</h2>
          <p className="text-sm text-black/50">
            Process only this seller&apos;s fulfillment state inside multi-seller orders.
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

      {error ? (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-800">
          {error}
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-black/40">
            <tr>
              <th className="pb-3">Order</th>
              <th className="pb-3">Customer</th>
              <th className="pb-3">Products</th>
              <th className="pb-3">Seller amount</th>
              <th className="pb-3">Placed</th>
              <th className="pb-3">Status</th>
              <th className="pb-3">Action</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((order) => {
              const next = nextSellerStatus(order.status);
              const busy = busyOrder === order.id;

              return (
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
                  <td className="py-4">
                    {next ? (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void advance(order)}
                        className="rounded-full bg-black px-3 py-2 text-xs font-black text-white disabled:opacity-50"
                      >
                        {busy ? "Updating…" : next.label}
                      </button>
                    ) : (
                      <span className="text-xs font-bold text-black/35">
                        No seller action
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}

            {!rows.length ? (
              <tr>
                <td colSpan={7} className="border-t border-black/8 py-12 text-center">
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
