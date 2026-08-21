"use client";

import Image from "next/image";
import Link from "next/link";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { WishlistButton } from "@/components/cart/wishlist-button";
import { getDiscount } from "@/lib/catalog-filter";
import type { CatalogProduct } from "@/types/catalog";

const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

export function CatalogProductCard({ product }: { product: CatalogProduct }) {
  const discount = getDiscount(product);
  const unavailable = product.stock === "out-of-stock";
  const snapshot = { id: product.id, slug: product.slug, name: product.name, brand: product.brand, image: product.image, price: product.price, compareAtPrice: product.compareAtPrice, stock: product.stock };
  return <article className="group min-w-0 rounded-[24px] border border-transparent p-2 transition hover:border-black/8 hover:bg-white hover:shadow-[0_18px_55px_rgba(17,17,15,0.07)]"><Link href={`/product/${product.slug}`} className="block"><div className="relative aspect-[4/5] overflow-hidden rounded-[20px] bg-[#ecece8]"><Image src={product.image} alt={product.name} fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" className={`object-cover transition duration-500 group-hover:scale-[1.035] ${unavailable ? "grayscale-[35%] opacity-75" : ""}`} /><div className="absolute left-2 top-2 flex flex-wrap gap-1.5">{product.badge ? <span className="rounded-full bg-[#d7ff47] px-2.5 py-1 text-[10px] font-black uppercase tracking-wide">{product.badge}</span> : null}{discount > 0 ? <span className="rounded-full bg-black px-2.5 py-1 text-[10px] font-black text-white">-{discount}%</span> : null}</div><div className="absolute right-2 top-2" onClick={(event) => event.preventDefault()}><WishlistButton product={snapshot} compact /></div>{unavailable ? <span className="absolute inset-x-3 bottom-3 rounded-full bg-white/95 px-3 py-2 text-center text-xs font-black">Currently out of stock</span> : null}</div></Link><div className="px-1 pb-1 pt-3"><div className="flex items-center justify-between gap-2"><p className="text-[10px] font-black uppercase tracking-[0.14em] text-black/40">{product.brand}</p><p className={`text-[10px] font-black ${product.stock === "low-stock" ? "text-orange-600" : product.stock === "out-of-stock" ? "text-black/35" : "text-emerald-700"}`}>{product.stock === "low-stock" ? `Only ${product.inventory} left` : product.stock === "out-of-stock" ? "Restocking" : "In stock"}</p></div><Link href={`/product/${product.slug}`}><h2 className="mt-1 line-clamp-2 min-h-10 text-sm font-black leading-5 sm:text-[15px]">{product.name}</h2></Link><div className="mt-2 flex flex-wrap items-baseline gap-2"><span className="text-base font-black">{currency.format(product.price)}</span>{product.compareAtPrice ? <span className="text-xs font-bold text-black/35 line-through">{currency.format(product.compareAtPrice)}</span> : null}</div><div className="mt-2 flex items-center justify-between gap-2 text-[11px] font-bold text-black/45"><span>â˜… {product.rating.toFixed(1)} Â· {product.reviews.toLocaleString("en-IN")}</span><span>{product.delivery}</span></div><AddToCartButton product={snapshot} className="mt-3 w-full rounded-full bg-[#D7FF47] px-4 py-2.5 text-xs font-black text-black transition hover:bg-[#C7ED37] disabled:cursor-not-allowed disabled:bg-black/20" /></div></article>;
}

