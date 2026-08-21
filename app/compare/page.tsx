import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { AiComparisonTable } from "@/components/ai/ai-comparison-table";
import { AiReviewSummary } from "@/components/ai/ai-review-summary";
import { buildComparisonRows, getComparisonProducts } from "@/lib/ai-commerce";
export const metadata:Metadata={title:"AI Product Compare | NEXORA"};
export default function ComparePage(){const products=getComparisonProducts();const rows=buildComparisonRows(products);return <div className="py-12 sm:py-16"><Container><p className="text-xs font-black uppercase tracking-[.18em] text-black/40">AI Compare</p><h1 className="mt-2 text-4xl font-black tracking-[-.05em] sm:text-5xl">Side-by-side, without the guesswork.</h1><p className="mt-3 max-w-2xl text-black/55">NEXORA highlights objective winners for price, rating, reviews and availability. Final choice still depends on your use-case.</p><div className="mt-8"><AiComparisonTable products={products} rows={rows}/></div><div className="mt-6"><AiReviewSummary/></div></Container></div>}
