import Link from "next/link";
import type { ProductDetail } from "@/types/product-detail";
export function ProductBreadcrumbs({ product }: { product: ProductDetail }) {
  return <nav aria-label="Breadcrumb" className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-5 text-xs font-bold text-black/45 sm:px-6 lg:px-8"><Link href="/" className="hover:text-black">Home</Link><span>/</span><Link href="/shop" className="hover:text-black">Shop</Link><span>/</span><Link href={`/shop?category=${product.category}`} className="capitalize hover:text-black">{product.category}</Link><span>/</span><span className="min-w-0 truncate text-black/75">{product.name}</span></nav>;
}
