import Image from "next/image";
import Link from "next/link";
import type { CatalogProduct } from "@/types/catalog";
import { formatInr } from "@/lib/ai-commerce";

export function AiProductResult({ product, rank }: { product: CatalogProduct; rank: number }) {
  return (
    <Link href={`/product/${product.slug}`} className="group block min-w-[220px] overflow-hidden rounded-[24px] border border-black/10 bg-white p-3 shadow-sm">
      <div className="relative aspect-[4/3] overflow-hidden rounded-[18px] bg-[#efefe9]"><Image src={product.image} alt={product.name} fill sizes="(max-width: 640px) 75vw, (max-width: 1024px) 40vw, 320px" className="object-cover transition duration-500 group-hover:scale-105" /><span className="absolute left-3 top-3 rounded-full bg-[#d7ff47] px-2 py-1 text-[10px] font-black">#{rank} AI PICK</span></div>
      <div className="px-1 pb-1 pt-3"><p className="text-[11px] font-black uppercase tracking-[.14em] text-black/40">{product.brand}</p><h3 className="mt-1 line-clamp-2 text-sm font-black leading-5">{product.name}</h3><div className="mt-2 flex items-center justify-between gap-2"><strong>{formatInr(product.price)}</strong><span className="text-xs font-bold text-black/50">★ {product.rating}</span></div></div>
    </Link>
  );
}
