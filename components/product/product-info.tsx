import type { ProductDetail } from "@/types/product-detail";
import { ProductRating } from "@/components/product/product-rating";
import { PriceBlock } from "@/components/product/price-block";
import { ProductVariantPicker } from "@/components/product/product-variant-picker";
import { DeliveryChecker } from "@/components/product/delivery-checker";
import { OfferList } from "@/components/product/offer-list";
import { ProductActions } from "@/components/product/product-actions";
import { StockStatus } from "@/components/product/stock-status";

export function ProductInfo({ product }: { product: ProductDetail }) {
  return (
    <div className="min-w-0 lg:sticky lg:top-24 lg:self-start">
      <p className="text-[9px] font-black uppercase tracking-[0.16em] text-black/40 sm:text-[11px] sm:tracking-[0.18em]">
        {product.brand} · {product.sku}
      </p>
      <h1 className="mt-1.5 text-[22px] font-black leading-[1.05] tracking-[-0.04em] sm:mt-2 sm:text-4xl sm:leading-tight">
        {product.name}
      </h1>
      <p className="mt-2 line-clamp-2 text-xs leading-5 text-black/55 sm:mt-3 sm:text-sm sm:leading-6">
        {product.subtitle}
      </p>
      <div className="mt-2.5 sm:mt-4">
        <ProductRating rating={product.rating} reviews={product.reviews} />
      </div>
      <div className="mt-3 sm:mt-5">
        <PriceBlock product={product} />
        <div className="mt-2 sm:mt-3">
          <StockStatus status={product.stock} inventory={product.inventory} />
        </div>
      </div>
      <div className="my-4 h-px bg-black/8 sm:my-6" />
      <ProductVariantPicker colors={product.colorOptions} sizes={product.sizes} />
      <div className="mt-4 sm:mt-6">
        <ProductActions unavailable={product.stock === "out-of-stock"} productId={product.id} />
      </div>
      <p className="mt-2 text-center text-[10px] font-bold text-black/40 sm:text-[11px]">
        Free shipping on eligible orders · Protected checkout
      </p>
      <div className="mt-4 sm:mt-5"><DeliveryChecker defaultDelivery={product.delivery} /></div>
      <div className="mt-4 sm:mt-5"><OfferList offers={product.offers} /></div>
    </div>
  );
}
