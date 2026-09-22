"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AccountSidebar } from "@/components/account/account-sidebar";
import { readProductAlerts, removeProductAlert } from "@/lib/engagement-store";
import type { ProductAlert } from "@/types/engagement";

const money = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function PriceAlertsPanel() {
  const [alerts, setAlerts] = useState<ProductAlert[]>([]);

  useEffect(() => {
    queueMicrotask(() => setAlerts(readProductAlerts()));
  }, []);

  const remove = (id: string) => setAlerts(removeProductAlert(id));

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-7">
        <p className="text-xs font-black uppercase tracking-[.2em] text-black/35">
          Smart watchlist
        </p>
        <h1 className="mt-2 text-4xl font-black tracking-[-.05em]">Product alerts</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <AccountSidebar />
        <div>
          {alerts.length === 0 ? (
            <div className="rounded-[30px] border border-dashed border-black/15 bg-white p-10 text-center">
              <p className="text-4xl">🔔</p>
              <h2 className="mt-4 text-2xl font-black">No alerts yet</h2>
              <p className="mx-auto mt-2 max-w-md text-sm font-bold text-black/45">
                Open a product and enable a price-drop or back-in-stock alert.
              </p>
              <Link
                href="/shop"
                className="mt-5 inline-block rounded-full bg-black px-5 py-3 text-sm font-black text-white"
              >
                Browse products
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex gap-4 rounded-[26px] border border-black/8 bg-white p-4"
                >
                  <Link
                    href={`/product/${alert.slug}`}
                    className="relative h-24 w-20 shrink-0 overflow-hidden rounded-2xl bg-black/5"
                  >
                    <Image
                      src={alert.image}
                      alt={alert.name}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </Link>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[.15em] text-black/35">
                          {alert.kind === "price-drop" ? "Price drop" : "Back in stock"}
                        </p>
                        <Link
                          href={`/product/${alert.slug}`}
                          className="mt-1 block font-black"
                        >
                          {alert.name}
                        </Link>
                      </div>
                      <button
                        onClick={() => remove(alert.id)}
                        className="text-xs font-black text-black/35"
                      >
                        Remove
                      </button>
                    </div>

                    <p className="mt-2 text-sm font-bold text-black/45">
                      Current {money.format(alert.currentPrice)}
                      {alert.targetPrice
                        ? ` · Alert at ${money.format(alert.targetPrice)} or below`
                        : " · Notify when inventory returns"}
                    </p>
                    <span className="mt-3 inline-flex rounded-full bg-[#eff5d5] px-3 py-1 text-[10px] font-black uppercase tracking-wide text-emerald-800">
                      Active
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
