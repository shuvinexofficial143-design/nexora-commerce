"use client";
import { useState } from "react";
export function ReferralShareCard({ code }: { code: string }) {
  const [copied,setCopied]=useState(false);
  const copy=async()=>{try{await navigator.clipboard.writeText(code);setCopied(true);setTimeout(()=>setCopied(false),1500);}catch{setCopied(false);}};
  const share=async()=>{const text=`Join NEXORA with my code ${code} and unlock a new-member reward.`;if(navigator.share){await navigator.share({title:"NEXORA invite",text}).catch(()=>undefined);}else{await navigator.clipboard.writeText(text).catch(()=>undefined);setCopied(true);}};
  return <div className="rounded-[28px] bg-[#d7ff47] p-6"><p className="text-xs font-black uppercase tracking-[.18em]">Your invite code</p><div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center"><div className="flex-1 rounded-2xl bg-white/80 px-4 py-4 font-black tracking-[.08em]">{code}</div><button onClick={copy} className="rounded-full bg-black px-5 py-3 text-sm font-black text-white">{copied?"Copied":"Copy code"}</button><button onClick={share} className="rounded-full border border-black/15 px-5 py-3 text-sm font-black">Share</button></div><p className="mt-4 text-sm font-bold text-black/60">Your friend gets ₹250 off an eligible first order. You receive 500 points after their qualifying purchase.</p></div>;
}
