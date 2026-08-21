import { getAiFeaturedProducts } from "@/lib/ai-commerce";
import { AiProductResult } from "@/components/ai/ai-product-result";

export function AiRecommendationGrid() {
  const products = getAiFeaturedProducts();
  return <section className="mt-12"><div className="mb-5 flex items-end justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[.16em] text-black/40">AI discovery</p><h2 className="mt-1 text-2xl font-black tracking-[-.03em]">Popular products worth asking about</h2></div></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{products.map((product, index) => <AiProductResult key={product.id} product={product} rank={index + 1} />)}</div></section>;
}
