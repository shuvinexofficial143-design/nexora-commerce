import Image from "next/image";
import Link from "next/link";
import { getDiscount } from "@/lib/catalog-filter";
import type { CatalogProduct } from "@/types/catalog";

const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

export function ProductListCard({ product }: { product: CatalogProduct }) {
  const discount = getDiscount(product);
  const unavailable = product.stock === "out-of-stock";
  return (
    <article className="grid grid-cols-[120px_1fr] gap-4 rounded-[24px] border border-black/10 bg-white p-3 sm:grid-cols-[170px_1fr_auto] sm:items-center sm:p-4">
      <Link href={`/product/${product.slug}`} className="relative aspect-square overflow-hidden rounded-[18px] bg-[#ecece8]">
        <Image src={product.image} alt={product.name} fill sizes="170px" className="object-cover" />
      </Link>
      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-black/40">{product.brand} Â· {product.category}</p>
        <Link href={`/product/${product.slug}`}><h2 className="mt-1 text-base font-black tracking-tight sm:text-lg">{product.name}</h2></Link>
        <p className="mt-2 text-xs font-semibold text-black/50">â˜… {product.rating.toFixed(1)} ({product.reviews.toLocaleString("en-IN")}) Â· {product.delivery}</p>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-lg font-black">{currency.format(product.price)}</span>
          {product.compareAtPrice ? <span className="text-xs font-bold text-black/35 line-through">{currency.format(product.compareAtPrice)}</span> : null}
          {discount ? <span className="text-xs font-black text-emerald-700">{discount}% off</span> : null}
        </div>
      </div>
      <div className="col-span-2 flex gap-2 sm:col-span-1 sm:w-36 sm:flex-col">
        <button type="button" disabled={unavailable} className="flex-1 rounded-full bg-[#D7FF47] px-4 py-2.5 text-xs font-black text-black disabled:bg-black/20">{unavailable ? "Notify me" : "Add to bag"}</button>
        <button type="button" className="flex-1 rounded-full border border-black/10 px-4 py-2.5 text-xs font-black">Wishlist</button>
      </div>
    </article>
  );
}

