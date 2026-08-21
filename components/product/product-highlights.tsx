import type { ProductDetail } from "@/types/product-detail";
import { ProductSectionTitle } from "@/components/product/product-section-title";
export function ProductHighlights({ product }: { product: ProductDetail }) {
  return <section className="rounded-[32px] bg-[#171714] p-6 text-white sm:p-8"><ProductSectionTitle eyebrow="Why it stands out" title="Designed around the details" description={product.description} /><div className="grid gap-3 sm:grid-cols-2">{product.highlights.map((item, index) => <div key={item} className="rounded-[22px] border border-white/10 bg-white/5 p-4"><span className="text-xs font-black text-[#d7ff47]">0{index + 1}</span><p className="mt-3 text-sm font-black">{item}</p></div>)}</div></section>;
}
