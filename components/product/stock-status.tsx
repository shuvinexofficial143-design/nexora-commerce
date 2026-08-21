import type { StockStatus as StockState } from "@/types/catalog";

export function StockStatus({ status, inventory }: { status: StockState; inventory: number }) {
  const label = status === "in-stock" ? "In stock · ready to dispatch" : status === "low-stock" ? `Only ${inventory} left · order soon` : "Currently out of stock";
  const dot = status === "in-stock" ? "bg-emerald-500" : status === "low-stock" ? "bg-orange-500" : "bg-black/25";
  return <div className="inline-flex items-center gap-2 text-xs font-black text-black/55"><span className={`h-2 w-2 rounded-full ${dot}`} />{label}</div>;
}
