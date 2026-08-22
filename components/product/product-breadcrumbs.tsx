import Link from "next/link";
import type { ProductDetail } from "@/types/product-detail";

export function ProductBreadcrumbs({ product }: { product: ProductDetail }) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="mx-auto flex max-w-7xl items-center gap-1.5 overflow-hidden px-4 py-2.5 text-[10px] font-bold text-black/45 sm:gap-2 sm:px-6 sm:py-5 sm:text-xs lg:px-8"
    >
      <Link href="/" className="shrink-0 hover:text-black">Home</Link>
      <span>/</span>
      <Link href="/shop" className="shrink-0 hover:text-black">Shop</Link>
      <span>/</span>
      <Link href={`/shop?category=${product.category}`} className="shrink-0 capitalize hover:text-black">
        {product.category}
      </Link>
      <span>/</span>
      <span className="min-w-0 truncate text-black/75">{product.name}</span>
    </nav>
  );
}
