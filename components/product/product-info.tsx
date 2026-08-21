import type { ProductDetail } from "@/types/product-detail";
import { ProductRating } from "@/components/product/product-rating";
import { PriceBlock } from "@/components/product/price-block";
import { ProductVariantPicker } from "@/components/product/product-variant-picker";
import { DeliveryChecker } from "@/components/product/delivery-checker";
import { OfferList } from "@/components/product/offer-list";
import { ProductActions } from "@/components/product/product-actions";
import { StockStatus } from "@/components/product/stock-status";

export function ProductInfo({ product }: { product: ProductDetail }) {
  return <div className="lg:sticky lg:top-24 lg:self-start"><p className="text-[11px] font-black uppercase tracking-[0.18em] text-black/40">{product.brand} · {product.sku}</p><h1 className="mt-2 text-3xl font-black leading-tight tracking-[-0.045em] sm:text-4xl">{product.name}</h1><p className="mt-3 text-sm leading-6 text-black/55">{product.subtitle}</p><div className="mt-4"><ProductRating rating={product.rating} reviews={product.reviews} /></div><div className="mt-5"><PriceBlock product={product} /><div className="mt-3"><StockStatus status={product.stock} inventory={product.inventory} /></div></div><div className="my-6 h-px bg-black/8" /><ProductVariantPicker colors={product.colorOptions} sizes={product.sizes} /><div className="mt-6"><ProductActions unavailable={product.stock === "out-of-stock"} productId={product.id} /></div><p className="mt-2 text-center text-[11px] font-bold text-black/40">Free shipping on eligible orders · Protected checkout</p><div className="mt-5"><DeliveryChecker defaultDelivery={product.delivery} /></div><div className="mt-5"><OfferList offers={product.offers} /></div></div>;
}
