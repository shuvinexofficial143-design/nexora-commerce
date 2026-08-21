"use client";
import Image from "next/image";
import { useState } from "react";
import type { ProductImage } from "@/types/product-detail";
import { GalleryThumbnails } from "@/components/product/gallery-thumbnails";
export function ProductGallery({ images, badge }: { images: ProductImage[]; badge?: string }) {
  const [active, setActive] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const image = images[active] ?? images[0];
  return <div className="grid gap-3 lg:grid-cols-[72px_minmax(0,1fr)]"><GalleryThumbnails images={images} active={active} onSelect={setActive} /><div className="relative aspect-[4/5] overflow-hidden rounded-[28px] bg-[#ecece8] sm:rounded-[36px]"><button type="button" onClick={() => setZoomed((value) => !value)} className="absolute inset-0 z-10 cursor-zoom-in" aria-label={zoomed ? "Zoom out image" : "Zoom product image"} /><Image src={image.src} alt={image.alt} fill priority className={`object-cover transition duration-500 ${zoomed ? "scale-125" : "scale-100"}`} sizes="(max-width: 1024px) 100vw, 50vw" />{badge ? <span className="absolute left-4 top-4 z-20 rounded-full bg-[#d7ff47] px-3 py-1.5 text-[11px] font-black uppercase tracking-wide">{badge}</span> : null}<span className="pointer-events-none absolute bottom-4 right-4 z-20 rounded-full bg-white/90 px-3 py-2 text-[11px] font-black shadow-sm backdrop-blur">⌕ Click to zoom</span></div></div>;
}
