"use client";

import { useEffect, useMemo, useState } from "react";
import { AccountSidebar } from "@/components/account/account-sidebar";
import { fetchMyOrders } from "@/lib/api/orders-client";
import { fetchMyReturns, requestReturn } from "@/lib/api/returns-client";
import { mapBackendOrder } from "@/lib/backend-mappers";
import type { AccountOrder } from "@/types/account";

const reasons = [
  "Damaged or defective",
  "Wrong item received",
  "Size or fit issue",
  "Changed my mind",
  "Other",
];

export function ReturnsCenter() {
  const [orders, setOrders] = useState<AccountOrder[]>([]);
  const [requested, setRequested] = useState<string[]>([]);
  const [selectedReason, setSelectedReason] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    Promise.all([fetchMyOrders(), fetchMyReturns()])
      .then(([orderRows, returnRows]) => {
        if (!active) return;
        setOrders(orderRows.map(mapBackendOrder));
        setRequested(returnRows.map((item) => item.orderNumber));
      })
      .catch((error) => {
        if (active) {
          setMessage(error instanceof Error ? error.message : "Could not load returns.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const eligible = useMemo(
    () =>
      orders.filter(
        (order) => order.status === "Delivered" || order.status === "Shipped",
      ),
    [orders],
  );

  async function submitReturn(order: AccountOrder) {
    const reason = selectedReason[order.id];
    if (!reason || submitting) return;

    setSubmitting(order.id);
    setMessage("");

    try {
      await requestReturn({ orderNumber: order.id, reason });
      setRequested((current) => [...new Set([...current, order.id])]);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not create return request.");
    } finally {
      setSubmitting(null);
    }
  }

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
              Real return requests, linked to your orders.
            </h2>
            <p className="mt-2 text-sm font-bold text-white/55">
              Eligible shipped or delivered orders can now create a database-backed return request.
            </p>
          </div>

          {message ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-800">
              {message}
            </div>
          ) : null}

          {loading ? (
            <div className="h-44 animate-pulse rounded-[28px] bg-black/5" />
          ) : eligible.length ? (
            eligible.map((order) => {
              const alreadyRequested = requested.includes(order.id);

              return (
                <div
                  key={order.id}
                  className="rounded-[28px] border border-black/10 bg-white p-5"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-black text-black/35">ORDER {order.id}</p>
                      <h3 className="mt-2 font-black">{order.items[0]?.name}</h3>
                      <p className="mt-1 text-xs font-bold text-black/45">
                        {order.status} · {order.items.length} item(s)
                      </p>
                    </div>

                    {alreadyRequested ? (
                      <span className="h-fit rounded-full bg-[#d7ff47] px-4 py-2.5 text-xs font-black">
                        Return requested ✓
                      </span>
                    ) : (
                      <div className="flex min-w-0 flex-col gap-2 sm:w-64">
                        <select
                          value={selectedReason[order.id] ?? ""}
                          onChange={(event) =>
                            setSelectedReason((current) => ({
                              ...current,
                              [order.id]: event.target.value,
                            }))
                          }
                          className="rounded-2xl border border-black/10 bg-white px-3 py-2.5 text-xs font-bold"
                        >
                          <option value="">Choose reason</option>
                          {reasons.map((reason) => (
                            <option key={reason} value={reason}>
                              {reason}
                            </option>
                          ))}
                        </select>

                        <button
                          disabled={!selectedReason[order.id] || submitting === order.id}
                          onClick={() => void submitReturn(order)}
                          className="rounded-full bg-black px-4 py-2.5 text-xs font-black text-white disabled:opacity-40"
                        >
                          {submitting === order.id ? "Submitting…" : "Request return"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-[28px] border border-dashed border-black/15 bg-white p-10 text-center">
              <p className="text-4xl">↩️</p>
              <h3 className="mt-3 text-xl font-black">No return-eligible orders</h3>
              <p className="mt-2 text-sm font-bold text-black/45">
                Shipped or delivered database orders will appear here.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
