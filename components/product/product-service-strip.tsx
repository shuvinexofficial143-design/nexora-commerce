import type { ProductDetail } from "@/types/product-detail";
const items = [
  ["↺", "Easy returns", "returnPolicy"],
  ["◇", "Quality cover", "warranty"],
  ["✓", "Trusted seller", "seller"],
] as const;
export function ProductServiceStrip({ product }: { product: ProductDetail }) {
  return <section className="grid gap-3 sm:grid-cols-3">{items.map(([icon, title, key]) => <div key={title} className="rounded-[24px] border border-black/8 bg-white p-5"><span className="grid h-9 w-9 place-items-center rounded-full bg-[#d7ff47] text-lg font-black">{icon}</span><p className="mt-4 text-sm font-black">{title}</p><p className="mt-1 text-xs leading-5 text-black/50">{product[key]}</p></div>)}</section>;
}
