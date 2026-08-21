"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { AccountSidebar } from "@/components/account/account-sidebar";
import { BackendOrdersStatus } from "@/components/account/backend-orders-status";
import { OrderTracker } from "@/components/account/order-tracker";
import { fetchMyOrder } from "@/lib/api/orders-client";
import { mapBackendOrder } from "@/lib/backend-mappers";
import type { AccountOrder } from "@/types/account";

const money = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

export function OrderDetail({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<AccountOrder | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    fetchMyOrder(orderId)
      .then((row) => {
        if (!active) return;
        setOrder(mapBackendOrder(row));
        setState("ready");
      })
      .catch((error) => {
        if (!active) return;
        setMessage(error instanceof Error ? error.message : "Could not load this order.");
        setState("error");
      });

    return () => {
      active = false;
    };
  }, [orderId]);

  if (state === "loading") {
    return (
      <div className="mx-auto max-w-7xl px-4 py-14">
        <div className="h-80 animate-pulse rounded-[32px] bg-black/5" />
      </div>
    );
  }

  if (state === "error" || !order) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-20">
        <BackendOrdersStatus
          title="Order could not be loaded"
          message={message || "This database order was not found."}
          action={
            <Link href="/account/orders" className="inline-flex rounded-full bg-black px-5 py-3 text-sm font-black text-white">
              Back to orders
            </Link>
          }
        />
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-7">
        <Link href="/account/orders" className="text-xs font-black text-black/45">
          ← All orders
        </Link>
        <h1 className="mt-3 text-4xl font-black tracking-[-.05em]">Order {order.id}</h1>
        <p className="mt-2 text-sm font-bold text-black/45">Tracking {order.trackingNumber}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <AccountSidebar />

        <div className="space-y-5">
          <OrderTracker status={order.status} />

          <div className="rounded-[28px] border border-black/10 bg-white p-5 sm:p-6">
            <h2 className="text-xl font-black">Database order items</h2>

            <div className="mt-4 divide-y divide-black/8">
              {order.items.map((item) => {
                const remoteImage = item.image.startsWith("http");

                return (
                  <div key={item.lineId} className="flex gap-4 py-4">
                    <div className="relative grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-2xl bg-[#f4f3ef] text-3xl">
                      {remoteImage ? (
                        <Image src={item.image} alt={item.name} fill sizes="80px" className="object-cover" />
                      ) : (
                        item.image
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="font-black">{item.name}</p>
                      <p className="mt-1 text-xs font-bold text-black/40">
                        Qty {item.quantity}
                        {item.color ? ` · ${item.color}` : ""}
                        {item.size ? ` · ${item.size}` : ""}
                      </p>
                    </div>

                    <p className="font-black">{money(item.price * item.quantity)}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="rounded-[28px] border border-black/10 bg-white p-5">
              <h3 className="font-black">Delivery</h3>
              <p className="mt-3 text-sm font-bold leading-6 text-black/50">{order.address}</p>
              <p className="mt-3 text-xs font-black">
                {order.deliveryLabel} · {order.eta}
              </p>
            </div>

            <div className="rounded-[28px] border border-black/10 bg-white p-5">
              <h3 className="font-black">Payment summary</h3>
              <div className="mt-3 space-y-2 text-sm font-bold text-black/50">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{money(order.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Discount</span>
                  <span>-{money(order.discount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping + tax</span>
                  <span>{money(order.shipping + order.tax)}</span>
                </div>
                <div className="flex justify-between border-t border-black/8 pt-3 text-base font-black text-black">
                  <span>Total</span>
                  <span>{money(order.total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
