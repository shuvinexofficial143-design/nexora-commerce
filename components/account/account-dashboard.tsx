"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/auth-provider";
import { useCart } from "@/components/cart/cart-provider";
import { AccountSidebar } from "@/components/account/account-sidebar";
import { AccountStatGrid } from "@/components/account/account-stat-grid";
import { OrderCard } from "@/components/account/order-card";
import { ProfileCard } from "@/components/account/profile-card";
import { SecurityCard } from "@/components/account/security-card";
import { SupportCard } from "@/components/account/support-card";
import { fetchMyOrders } from "@/lib/api/orders-client";
import { mapBackendOrder } from "@/lib/backend-mappers";
import type { AccountOrder } from "@/types/account";

export function AccountDashboard() {
  const { session, ready } = useAuth();
  const { wishlist } = useCart();
  const [orders, setOrders] = useState<AccountOrder[]>([]);

  useEffect(() => {
    if (!ready || !session) return;

    let active = true;
    fetchMyOrders()
      .then((rows) => {
        if (active) setOrders(rows.map(mapBackendOrder));
      })
      .catch(() => {
        if (active) setOrders([]);
      });

    return () => {
      active = false;
    };
  }, [ready, session]);

  const points = 1250;
  const stats = useMemo(
    () => [
      {
        label: "Orders",
        value: String(orders.length),
        caption: "Purchases & tracking",
        href: "/account/orders",
      },
      {
        label: "Reward points",
        value: points.toLocaleString("en-IN"),
        caption: "≈ ₹125 member value",
        href: "/account/wallet",
      },
      {
        label: "Wishlist",
        value: String(wishlist.length),
        caption: "Saved products",
        href: "/wishlist",
      },
      {
        label: "Unread alerts",
        value: "2",
        caption: "Deals & order updates",
        href: "/account/notifications",
      },
    ],
    [orders.length, wishlist.length],
  );

  if (!ready) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16">
        <div className="h-64 animate-pulse rounded-[32px] bg-black/5" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="text-4xl font-black">Sign in required</h1>
        <Link
          href="/login"
          className="mt-6 inline-flex rounded-full bg-black px-6 py-3 text-sm font-black text-white"
        >
          Go to sign in
        </Link>
      </div>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 overflow-hidden rounded-[32px] bg-[#171714] p-7 text-white sm:p-10">
        <p className="text-xs font-black uppercase tracking-[.2em] text-[#d7ff47]">
          Member dashboard · {session.user.tier}
        </p>
        <h1 className="mt-3 text-4xl font-black tracking-[-.05em] sm:text-5xl">
          Welcome back, {session.user.name.split(" ")[0]}.
        </h1>
        <p className="mt-3 max-w-xl text-sm font-bold text-white/55">
          Orders, rewards, returns, saved addresses and account security in one place.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <AccountSidebar />
        <div className="space-y-6">
          <AccountStatGrid stats={stats} />

          <div className="rounded-[28px] border border-black/10 bg-white p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[.16em] text-black/35">
                  Recent activity
                </p>
                <h2 className="mt-1 text-2xl font-black">Latest orders</h2>
              </div>
              <Link href="/account/orders" className="text-xs font-black">
                View all →
              </Link>
            </div>
            <div className="mt-5 space-y-4">
              {orders.slice(0, 2).map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
              {!orders.length ? (
                <p className="rounded-2xl bg-black/5 px-4 py-5 text-sm font-bold text-black/45">
                  Your production-backed orders will appear here.
                </p>
              ) : null}
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <ProfileCard session={session} />
            <SecurityCard />
          </div>
          <SupportCard />
        </div>
      </div>
    </section>
  );
}
