"use client";

import { useEffect, useState } from "react";
import { AccountSidebar } from "@/components/account/account-sidebar";
import { fetchMyOrders } from "@/lib/api/orders-client";
import { mapBackendOrder } from "@/lib/backend-mappers";
import type { AccountOrder } from "@/types/account";

export function ReturnsCenter() {
  const [orders, setOrders] = useState<AccountOrder[]>([]);
  const [requested, setRequested] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    fetchMyOrders()
      .then((rows) => {
        if (active) setOrders(rows.map(mapBackendOrder));
      })
      .catch(() => {
        if (active) setOrders([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const eligible = orders.filter(
    (order) => order.status === "Delivered" || order.status === "Shipped",
  );

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-7 text-4xl font-black tracking-[-.05em]">Returns & refunds</h1>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <AccountSidebar />
        <div className="space-y-4">
          <div className="rounded-[28px] bg-[#171714] p-6 text-white">
            <p className="text-xs font-black uppercase tracking-[.18em] text-[#d7ff47]">
              Self-service returns
            </p>
            <h2 className="mt-2 text-2xl font-black">
              Easy pickup, transparent refund tracking.
            </h2>
            <p className="mt-2 text-sm font-bold text-white/55">
              Return-eligible products are now loaded from your real NEXORA orders.
            </p>
          </div>

          {loading ? (
            <div className="h-44 animate-pulse rounded-[28px] bg-black/5" />
          ) : eligible.length ? (
            eligible.map((order) => (
              <div
                key={order.id}
                className="rounded-[28px] border border-black/10 bg-white p-5"
              >
                <div className="flex flex-wrap justify-between gap-3">
                  <div>
                    <p className="text-xs font-black text-black/35">ORDER {order.id}</p>
                    <h3 className="mt-2 font-black">{order.items[0]?.name}</h3>
                    <p className="mt-1 text-xs font-bold text-black/45">
                      {order.status} · {order.items.length} item(s)
                    </p>
                  </div>
                  <button
                    disabled={requested.includes(order.id)}
                    onClick={() => setRequested((current) => [...current, order.id])}
                    className="h-fit rounded-full border border-black/10 px-4 py-2.5 text-xs font-black disabled:bg-[#d7ff47]"
                  >
                    {requested.includes(order.id) ? "Return requested ✓" : "Start return"}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-[28px] border border-dashed border-black/15 bg-white p-10 text-center">
              <p className="text-4xl">↩️</p>
              <h3 className="mt-3 text-xl font-black">No return-eligible orders</h3>
              <p className="mt-2 text-sm font-bold text-black/45">
                Delivered or shipped database orders will appear here.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
