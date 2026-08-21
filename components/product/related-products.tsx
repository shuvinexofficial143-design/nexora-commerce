import type { CatalogProduct } from "@/types/catalog";
import { CatalogProductCard } from "@/components/catalog/catalog-product-card";
import { ProductSectionTitle } from "@/components/product/product-section-title";
export function RelatedProducts({ products }: { products: CatalogProduct[] }) {
  return <section><ProductSectionTitle eyebrow="Keep exploring" title="You may also like" description="More curated products chosen from the NEXORA catalogue." /><div className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4">{products.map((product) => <CatalogProductCard key={product.id} product={product} />)}</div></section>;
}
