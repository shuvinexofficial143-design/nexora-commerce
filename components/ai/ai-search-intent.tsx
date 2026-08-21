import type { AiShoppingIntent } from "@/types/ai";

export function AiSearchIntent({ intent }: { intent: AiShoppingIntent }) {
  const chips = [intent.category && `Category: ${intent.category}`, intent.budget && `Budget ≤ ₹${intent.budget.toLocaleString("en-IN")}`, ...intent.brands.map((brand) => `Brand: ${brand}`), ...intent.features.map((feature) => `Feature: ${feature}`)].filter(Boolean) as string[];
  if (!chips.length) return null;
  return <div className="rounded-[24px] border border-black/10 bg-[#f7f7f2] p-4"><p className="text-[10px] font-black uppercase tracking-[.18em] text-black/40">AI understood</p><div className="mt-3 flex flex-wrap gap-2">{chips.map((chip) => <span key={chip} className="rounded-full bg-white px-3 py-2 text-xs font-black text-black/65">{chip}</span>)}</div></div>;
}
