import type { ProductDetail } from "@/types/product-detail";
import { ProductSectionTitle } from "@/components/product/product-section-title";
export function ProductSpecifications({ product }: { product: ProductDetail }) {
  return <section><ProductSectionTitle eyebrow="Details" title="Specifications" description="Clear product information before you buy." /><div className="overflow-hidden rounded-[28px] border border-black/10 bg-white">{product.specifications.map((group, groupIndex) => <div key={group.title} className={groupIndex ? "border-t border-black/8" : ""}><h3 className="bg-[#f3f3ef] px-5 py-3 text-xs font-black uppercase tracking-[0.14em]">{group.title}</h3>{group.items.map((item) => <div key={item.label} className="grid grid-cols-[38%_1fr] gap-4 border-t border-black/6 px-5 py-3 text-sm first:border-t-0"><span className="font-bold text-black/45">{item.label}</span><span className="font-black">{item.value}</span></div>)}</div>)}</div></section>;
}
