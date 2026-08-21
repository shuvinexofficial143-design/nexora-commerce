import { CatalogProductCard } from "./catalog-product-card";
import { ProductListCard } from "./product-list-card";
import type { CatalogProduct, CatalogView } from "@/types/catalog";

type ProductGridProps = {
  products: CatalogProduct[];
  view: CatalogView;
};

export function ProductGrid({ products, view }: ProductGridProps) {
  if (view === "list") {
    return <div className="space-y-3">{products.map((product) => <ProductListCard key={product.id} product={product} />)}</div>;
  }
  return (
    <div className="grid grid-cols-2 gap-x-2 gap-y-5 sm:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => <CatalogProductCard key={product.id} product={product} />)}
    </div>
  );
}
