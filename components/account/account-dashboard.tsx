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
import { readOrders } from "@/lib/account-data";
import type { AccountOrder } from "@/types/account";

export function AccountDashboard(){
  const {session,ready}=useAuth();
  const {wishlist}=useCart();
  const [orders,setOrders]=useState<AccountOrder[]>([]);
  useEffect(()=>{if(ready)setOrders(readOrders())},[ready]);
  const points=1250;
  const stats=useMemo(()=>[
    {label:"Murti orders",value:String(orders.length),caption:"Purchases & protected delivery",href:"/account/orders"},
    {label:"Prakriti points",value:points.toLocaleString("en-IN"),caption:"Festival rewards & savings",href:"/account/wallet"},
    {label:"Wishlist",value:String(wishlist.length),caption:"Saved murtis",href:"/wishlist"},
    {label:"Unread alerts",value:"2",caption:"Stock & order updates",href:"/account/notifications"}
  ],[orders.length,wishlist.length]);

  if(!ready)return <div className="mx-auto max-w-7xl px-4 py-16"><div className="h-64 animate-pulse rounded-[32px] bg-black/5"/></div>;
  if(!session)return <div className="mx-auto max-w-xl px-4 py-20 text-center"><h1 className="text-4xl font-black">Sign in required</h1><p className="mt-3 text-sm font-semibold text-black/45">Sign in to view your Prakriti Ganesh orders, wishlist and festival rewards.</p><Link href="/login" className="mt-6 inline-flex rounded-full bg-[#1f3a2e] px-6 py-3 text-sm font-black text-white">Go to sign in</Link></div>;

  return <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
    <div className="mb-8 overflow-hidden rounded-[32px] bg-[#1f3a2e] p-7 text-white sm:p-10">
      <p className="text-xs font-black uppercase tracking-[.2em] text-[#f4d38b]">Prakriti Ganesh member · {session.user.tier}</p>
      <h1 className="mt-3 text-4xl font-black tracking-[-.05em] sm:text-5xl">Namaste, {session.user.name.split(" ")[0]}.</h1>
      <p className="mt-3 max-w-xl text-sm font-bold text-white/60">Your Ganesh orders, delivery updates, saved murtis, rewards and account details in one place.</p>
    </div>
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      <AccountSidebar/>
      <div className="space-y-6">
        <AccountStatGrid stats={stats}/>
        <div className="rounded-[28px] border border-black/10 bg-white p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[.16em] text-[#a54f2a]">Recent activity</p><h2 className="mt-1 text-2xl font-black">Latest Ganesh orders</h2></div><Link href="/account/orders" className="text-xs font-black">View all →</Link></div>
          <div className="mt-5 space-y-4">{orders.slice(0,2).map(o=><OrderCard key={o.id} order={o}/>)}</div>
        </div>
        <div className="grid gap-6 xl:grid-cols-2"><ProfileCard session={session}/><SecurityCard/></div>
        <SupportCard/>
      </div>
    </div>
  </section>;
}
