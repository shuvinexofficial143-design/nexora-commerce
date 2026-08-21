"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AccountSidebar } from "@/components/account/account-sidebar";
import { BackendOrdersStatus } from "@/components/account/backend-orders-status";
import { OrderCard } from "@/components/account/order-card";
import { fetchMyOrders } from "@/lib/api/orders-client";
import { mapBackendOrder } from "@/lib/backend-mappers";
import type { AccountOrder } from "@/types/account";

export function OrdersList() {
  const [orders, setOrders] = useState<AccountOrder[]>([]);
  const [filter, setFilter] = useState("All");
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    fetchMyOrders()
      .then((rows) => {
        if (!active) return;
        setOrders(rows.map(mapBackendOrder));
        setState("ready");
      })
      .catch((error) => {
        if (!active) return;
        setMessage(error instanceof Error ? error.message : "Could not load orders.");
        setState("error");
      });

    return () => {
      active = false;
    };
  }, []);

  const visible = useMemo(
    () => (filter === "All" ? orders : orders.filter((order) => order.status === filter)),
    [orders, filter],
  );

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-7">
        <p className="text-xs font-black uppercase tracking-[.2em] text-black/35">Customer dashboard</p>
        <h1 className="mt-2 text-4xl font-black tracking-[-.05em]">Your real orders</h1>
        <p className="mt-2 text-sm font-bold text-black/45">
          These orders come directly from the NEXORA PostgreSQL database.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <AccountSidebar />

        <div>
          <div className="mb-5 flex flex-wrap gap-2">
            {["All", "Processing", "Shipped", "Out for delivery", "Delivered"].map((item) => (
              <button
                key={item}
                onClick={() => setFilter(item)}
                className={`rounded-full px-4 py-2 text-xs font-black ${
                  filter === item ? "bg-black text-white" : "border border-black/10 bg-white"
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          {state === "loading" ? (
            <div className="space-y-4">
              {[0, 1].map((item) => (
                <div key={item} className="h-56 animate-pulse rounded-[28px] bg-black/5" />
              ))}
            </div>
          ) : null}

          {state === "error" ? (
            <BackendOrdersStatus
              title="Orders backend is unavailable"
              message={message}
              action={
                <button
                  onClick={() => window.location.reload()}
                  className="rounded-full bg-black px-5 py-3 text-sm font-black text-white"
                >
                  Try again
                </button>
              }
            />
          ) : null}

          {state === "ready" && visible.length ? (
            <div className="space-y-4">
              {visible.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          ) : null}

          {state === "ready" && !visible.length ? (
            <BackendOrdersStatus
              title={orders.length ? "No orders match this filter" : "No database orders yet"}
              message={
                orders.length
                  ? "Choose another status to see the rest of your orders."
                  : "Place your first production-backed order and it will appear here instantly."
              }
              action={
                <Link href="/shop" className="inline-flex rounded-full bg-black px-5 py-3 text-sm font-black text-white">
                  Explore products
                </Link>
              }
            />
          ) : null}
        </div>
      </div>
    </section>
  );
}
