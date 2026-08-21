"use client";
import Link from "next/link";
import { AccountSidebar } from "@/components/account/account-sidebar";
import { rewardActivity, rewardSummary } from "@/lib/engagement-data";

export function RewardsDashboard() {
  const progress = Math.min(100, Math.round((rewardSummary.lifetimePoints / rewardSummary.nextTierAt) * 100));
  return <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
    <div className="mb-7"><p className="text-xs font-black uppercase tracking-[.2em] text-black/35">Nexora Circle</p><h1 className="mt-2 text-4xl font-black tracking-[-.05em]">Rewards & loyalty</h1></div>
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]"><AccountSidebar/><div className="space-y-6">
      <div className="overflow-hidden rounded-[32px] bg-black p-6 text-white sm:p-8"><div className="flex flex-col justify-between gap-8 sm:flex-row sm:items-end"><div><p className="text-xs font-black uppercase tracking-[.2em] text-white/45">{rewardSummary.tier} member</p><p className="mt-3 text-5xl font-black tracking-[-.06em]">{rewardSummary.points.toLocaleString("en-IN")} pts</p><p className="mt-2 text-sm font-bold text-white/55">Worth about ₹{rewardSummary.rupeeValue} in eligible rewards.</p></div><Link href="/shop" className="w-fit rounded-full bg-[#d7ff47] px-5 py-3 text-sm font-black text-black">Earn more points</Link></div><div className="mt-8"><div className="mb-2 flex justify-between text-xs font-black"><span>{rewardSummary.tier}</span><span>{rewardSummary.nextTier} at {rewardSummary.nextTierAt.toLocaleString("en-IN")} pts</span></div><div className="h-2 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-[#d7ff47]" style={{width:`${progress}%`}}/></div></div></div>
      <div className="grid gap-4 sm:grid-cols-3">{[["5×","Points on select drops"],["Early","Flash-sale access"],["₹0","Member delivery perks"]].map(([value,label])=><div key={label} className="rounded-3xl border border-black/8 bg-white p-5"><p className="text-3xl font-black">{value}</p><p className="mt-2 text-sm font-bold text-black/45">{label}</p></div>)}</div>
      <div className="rounded-[28px] border border-black/8 bg-white p-6"><h2 className="text-xl font-black">Recent points activity</h2><div className="mt-5 divide-y divide-black/8">{rewardActivity.map(item=><div key={item.id} className="flex items-center justify-between gap-4 py-4"><div><p className="font-black">{item.label}</p><p className="mt-1 text-xs font-bold text-black/35">{item.date}</p></div><span className={`font-black ${item.kind==="earn"?"text-emerald-700":"text-black/45"}`}>{item.kind==="earn"?"+":"-"}{item.points} pts</span></div>)}</div></div>
    </div></div>
  </section>;
}
