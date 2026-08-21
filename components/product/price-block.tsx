import { getDiscount } from "@/lib/catalog-filter";
import type { ProductDetail } from "@/types/product-detail";
const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
export function PriceBlock({ product }: { product: ProductDetail }) {
  const discount = getDiscount(product);
  return <div><div className="flex flex-wrap items-end gap-x-3 gap-y-1"><span className="text-3xl font-black tracking-[-0.04em]">{currency.format(product.price)}</span>{product.compareAtPrice ? <span className="pb-1 text-sm font-bold text-black/35 line-through">{currency.format(product.compareAtPrice)}</span> : null}{discount > 0 ? <span className="mb-1 rounded-full bg-[#d7ff47] px-2.5 py-1 text-xs font-black">Save {discount}%</span> : null}</div><p className="mt-1 text-xs font-bold text-black/40">Inclusive of applicable taxes · Secure checkout</p></div>;
}
