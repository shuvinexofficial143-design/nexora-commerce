import Image from "next/image";
import Link from "next/link";
import { Badge } from "./badge";
import type { Product } from "@/types/commerce";

type ProductCardProps = {
  product: Product;
};

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function ProductCard({ product }: ProductCardProps) {
  const discount = product.compareAtPrice
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0;

  return (
    <article className="group min-w-0">
      <Link href={`/product/${product.slug}`} className="block">
        <div className="relative aspect-[4/5] overflow-hidden rounded-[22px] bg-[#ecece8] sm:rounded-[28px]">
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            className="object-cover transition duration-500 group-hover:scale-[1.04]"
          />
          <div className="absolute left-2 top-2 flex flex-col items-start gap-1.5 sm:left-3 sm:top-3">
            {product.badge ? <Badge tone="accent">{product.badge}</Badge> : null}
            {discount > 0 ? <Badge tone="dark">-{discount}%</Badge> : null}
          </div>
          <span className="absolute bottom-2 right-2 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-lg shadow-sm backdrop-blur sm:bottom-3 sm:right-3">
            ♡
          </span>
        </div>
        <div className="px-1 pt-3">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-black/40">{product.brand}</p>
          <h3 className="mt-1 line-clamp-2 text-sm font-bold leading-5 sm:text-base">{product.name}</h3>
          <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="text-sm font-black sm:text-base">{currency.format(product.price)}</span>
            {product.compareAtPrice ? (
              <span className="text-xs font-semibold text-black/35 line-through">{currency.format(product.compareAtPrice)}</span>
            ) : null}
          </div>
          <div className="mt-2 flex items-center gap-2 text-[11px] font-bold text-black/50">
            <span>★ {product.rating.toFixed(1)}</span>
            <span>({product.reviews.toLocaleString("en-IN")})</span>
          </div>
        </div>
      </Link>
    </article>
  );
}
