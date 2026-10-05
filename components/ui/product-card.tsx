import Link from "next/link";
import { Badge } from "./badge";
import { ProductMediaPreview } from "./product-media-preview";
import type { Product } from "@/types/commerce";

type ProductCardProps = {
  product: Product;
  compact?: boolean;
};

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function ProductCard({ product, compact = false }: ProductCardProps) {
  const discount = product.compareAtPrice
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0;

  return (
    <article className={`group min-w-0 ${compact ? "rounded-[18px] bg-white p-1.5 shadow-[0_8px_24px_rgba(17,17,15,0.05)]" : ""}`}>
      <Link href={`/product/${product.slug}`} className="block">
        <div className={`relative overflow-hidden bg-[#ecece8] ${compact ? "aspect-square rounded-[15px]" : "aspect-[4/5] rounded-[22px] sm:rounded-[28px]"}`}>
          <ProductMediaPreview
            image={product.image}
            alt={product.name}
            videoUrl={product.videoUrl}
            youtubeVideoId={product.youtubeVideoId}
            sizes={compact ? "50vw" : "(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"}
            className={compact ? "group-hover:scale-[1.03]" : ""}
          />
          <div className={`absolute flex flex-col items-start gap-1 ${compact ? "left-1.5 top-1.5" : "left-2 top-2 sm:left-3 sm:top-3"}`}>
            {product.badge ? <Badge tone="accent">{product.badge}</Badge> : null}
            {discount > 0 ? <Badge tone="dark">-{discount}%</Badge> : null}
          </div>
          <span className={`absolute grid place-items-center rounded-full bg-white/92 shadow-sm backdrop-blur ${compact ? "bottom-1.5 right-1.5 h-7 w-7 text-sm" : "bottom-2 right-2 h-9 w-9 text-lg sm:bottom-3 sm:right-3"}`}>
            ♡
          </span>
        </div>
        <div className={compact ? "px-1 pb-1 pt-2" : "px-1 pt-3"}>
          {!compact ? <p className="text-[10px] font-black uppercase tracking-[0.14em] text-black/40">{product.brand}</p> : null}
          <h3 className={`${compact ? "line-clamp-2 min-h-[32px] text-[12px] leading-4" : "mt-1 line-clamp-2 text-sm leading-5 sm:text-base"} font-bold`}>
            {product.name}
          </h3>
          <div className={`${compact ? "mt-1" : "mt-2"} flex flex-wrap items-baseline gap-x-1.5 gap-y-1`}>
            <span className={`${compact ? "text-[13px]" : "text-sm sm:text-base"} font-black`}>{currency.format(product.price)}</span>
            {product.compareAtPrice ? (
              <span className={`${compact ? "text-[9px]" : "text-xs"} font-semibold text-black/35 line-through`}>{currency.format(product.compareAtPrice)}</span>
            ) : null}
          </div>
          <div className={`${compact ? "mt-1 text-[9px]" : "mt-2 text-[11px]"} flex items-center gap-1.5 font-bold text-black/50`}>
            <span>★ {product.rating.toFixed(1)}</span>
            <span>({product.reviews.toLocaleString("en-IN")})</span>
          </div>
        </div>
      </Link>
    </article>
  );
}
