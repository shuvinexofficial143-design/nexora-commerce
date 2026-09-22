import Link from "next/link";
import { Container } from "@/components/ui/container";
import { AiChatPanel } from "@/components/ai/ai-chat-panel";
import { AiRecommendationGrid } from "@/components/ai/ai-recommendation-grid";
import type { CatalogProduct } from "@/types/catalog";

export function AiShopShell({ products }: { products: CatalogProduct[] }) {
  return <div className="soft-grid min-h-[80vh] py-10 sm:py-14"><Container><div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div><span className="rounded-full bg-[#171714] px-4 py-2 text-[11px] font-black uppercase tracking-[.18em] text-[#d7ff47]">NEXORA Intelligence</span><h1 className="mt-5 max-w-3xl text-4xl font-black tracking-[-.05em] sm:text-6xl">Your AI shopping copilot.</h1><p className="mt-4 max-w-2xl text-base leading-7 text-black/55">Budget, use-case, features ya category normal language me bolo. AI live catalog ko rank karke useful picks dega.</p></div><Link href="/compare" className="w-fit rounded-full border border-black/15 bg-white px-5 py-3 text-sm font-black">Open AI Compare →</Link></div><AiChatPanel /><AiRecommendationGrid products={products} /></Container></div>;
}
