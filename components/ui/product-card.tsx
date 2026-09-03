import Image from "next/image";
import Link from "next/link";
import { Badge } from "./badge";
import { BuyNowButton } from "@/components/cart/buy-now-button";
import type { Product } from "@/types/commerce";

type ProductCardProps = { product: Product; compact?: boolean };

const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

export function ProductCard({ product, compact = false }: ProductCardProps) {
  const discount = product.compareAtPrice ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100) : 0;
  return (
    <article className={`group min-w-0 overflow-hidden rounded-[20px] border border-black/10 bg-white ${compact ? "p-1.5 shadow-[0_8px_24px_rgba(17,17,15,0.05)]" : "p-2 sm:p-2.5"}`}>
      <Link href={`/product/${product.slug}`} className="block">
        <div className={`relative overflow-hidden bg-[#f3efe6] ${compact ? "aspect-square rounded-[15px]" : "aspect-square rounded-[18px] sm:rounded-[22px]"}`}>
          <Image src={product.image} alt={product.name} fill sizes={compact ? "50vw" : "(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"} className="object-contain p-2 transition duration-500 group-hover:scale-[1.035]" />
          <div className={`absolute flex flex-col items-start gap-1 ${compact ? "left-1.5 top-1.5" : "left-2 top-2"}`}>
            {product.badge ? <Badge tone="accent">{product.badge}</Badge> : null}
            {discount > 0 ? <Badge tone="dark">-{discount}%</Badge> : null}
          </div>
        </div>
        <div className={compact ? "px-1 pb-1 pt-2" : "px-1 pt-3"}>
          <h3 className={`${compact ? "line-clamp-2 min-h-[32px] text-[12px] leading-4" : "line-clamp-2 text-sm leading-5 sm:text-base"} font-black text-[#1f3a2e]`}>{product.name}</h3>
          <div className={`${compact ? "mt-1" : "mt-2"} flex flex-wrap items-baseline gap-x-1.5 gap-y-1`}>
            <span className={`${compact ? "text-[14px]" : "text-base sm:text-lg"} font-black text-[#a54f2a]`}>{currency.format(product.price)}</span>
            {product.compareAtPrice ? <span className={`${compact ? "text-[9px]" : "text-xs"} font-semibold text-black/35 line-through`}>{currency.format(product.compareAtPrice)}</span> : null}
          </div>
          <div className={`${compact ? "mt-1 text-[9px]" : "mt-2 text-[10px] sm:text-[11px]"} flex flex-wrap gap-1.5 font-black`}>
            <span className="rounded-full bg-[#edf6e9] px-2 py-1 text-[#1f3a2e]">COD Available</span>
            <span className="rounded-full bg-[#fff1df] px-2 py-1 text-[#a54f2a]">Festival Stock</span>
          </div>
        </div>
      </Link>
      <div className="mt-2 grid grid-cols-[1fr_auto] gap-2 px-1 pb-1">
        <BuyNowButton productId={product.id} compact={compact} />
        <Link href={`/product/${product.slug}`} className={`${compact ? "px-2.5 text-[10px]" : "px-3 text-xs"} grid min-h-10 place-items-center rounded-full border border-black/10 font-black text-[#1f3a2e]`}>Details</Link>
      </div>
    </article>
  );
}
