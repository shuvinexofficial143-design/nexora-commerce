import type { Product } from "@/types/commerce";
import { ProductCard } from "@/components/ui/product-card";

export function ProductCarousel({ products }: { products: Product[] }) {
  return (
    <div className="no-scrollbar -mx-4 mt-8 flex snap-x gap-3 overflow-x-auto px-4 pb-3 sm:mx-0 sm:px-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:pb-0 xl:grid-cols-5">
      {products.map((product) => (
        <div key={product.id} className="w-[68vw] shrink-0 snap-start sm:w-[42vw] md:w-[31vw] lg:w-auto">
          <ProductCard product={product} />
        </div>
      ))}
    </div>
  );
}
