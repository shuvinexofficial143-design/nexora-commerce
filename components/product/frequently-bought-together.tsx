import Image from "next/image";
import Link from "next/link";
import type { ProductDetail } from "@/types/product-detail";
import type { CatalogProduct } from "@/types/catalog";
import { ProductSectionTitle } from "@/components/product/product-section-title";
const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
export function FrequentlyBoughtTogether({ product, companions }: { product: ProductDetail; companions: CatalogProduct[] }) {
  const all = [product, ...companions]; const total = all.reduce((sum, item) => sum + item.price, 0);
  return <section><ProductSectionTitle eyebrow="Smart bundle" title="Frequently bought together" description="A simple bundle suggestion based on complementary catalogue picks." /><div className="rounded-[30px] border border-black/8 bg-white p-5 sm:p-6"><div className="grid gap-3 sm:grid-cols-3">{all.map((item, index) => <div key={item.slug} className="relative flex items-center gap-3 rounded-[20px] bg-[#f5f5f1] p-3">{index ? <span className="absolute -left-3 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-black px-2 py-1 text-xs font-black text-white sm:block">+</span> : null}<div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-xl bg-[#ecece8]"><Image src={item.image} alt={item.name} fill sizes="64px" className="object-cover" /></div><div className="min-w-0"><Link href={`/product/${item.slug}`} className="line-clamp-2 text-xs font-black hover:underline">{item.name}</Link><p className="mt-1 text-xs font-black">{currency.format(item.price)}</p></div></div>)}</div><div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-black/8 pt-5"><div><p className="text-xs font-bold text-black/40">Bundle total</p><p className="text-xl font-black">{currency.format(total)}</p></div><button type="button" className="rounded-full bg-black px-5 py-3 text-xs font-black text-white">Add all 3 to bag</button></div></div></section>;
}
