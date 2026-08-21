import type { CatalogProduct } from "@/types/catalog";
import { AiProductResult } from "@/components/ai/ai-product-result";

export function AiProductStrip({ products }: { products: CatalogProduct[] }) {
  return <div className="no-scrollbar mt-3 flex gap-3 overflow-x-auto pb-2">{products.map((product, index) => <AiProductResult key={product.id} product={product} rank={index + 1} />)}</div>;
}
