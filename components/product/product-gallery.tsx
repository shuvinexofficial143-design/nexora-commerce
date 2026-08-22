"use client";

import Image from "next/image";
import { useState } from "react";
import type { ProductImage } from "@/types/product-detail";
import { GalleryThumbnails } from "@/components/product/gallery-thumbnails";

export function ProductGallery({ images, badge }: { images: ProductImage[]; badge?: string }) {
  const [active, setActive] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const image = images[active] ?? images[0];

  return (
    <div className="grid min-w-0 gap-2 lg:grid-cols-[72px_minmax(0,1fr)] lg:gap-3">
      <div className="order-1 lg:order-2">
        <div className="relative h-[38dvh] min-h-[280px] max-h-[390px] overflow-hidden rounded-[22px] bg-[#ecece8] sm:h-auto sm:min-h-0 sm:max-h-none sm:aspect-[4/5] sm:rounded-[30px] lg:rounded-[36px]">
          <button
            type="button"
            onClick={() => setZoomed((value) => !value)}
            className="absolute inset-0 z-10 cursor-zoom-in"
            aria-label={zoomed ? "Zoom out image" : "Zoom product image"}
          />
          <Image
            src={image.src}
            alt={image.alt}
            fill
            priority
            className={`object-contain p-2 transition duration-500 sm:p-3 lg:p-0 lg:object-cover ${zoomed ? "scale-110 sm:scale-125" : "scale-100"}`}
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
          {badge ? (
            <span className="absolute left-3 top-3 z-20 rounded-full bg-[#d7ff47] px-2.5 py-1 text-[9px] font-black uppercase tracking-wide sm:left-4 sm:top-4 sm:px-3 sm:py-1.5 sm:text-[11px]">
              {badge}
            </span>
          ) : null}
          <span className="pointer-events-none absolute bottom-4 right-4 z-20 hidden rounded-full bg-white/90 px-3 py-2 text-[11px] font-black shadow-sm backdrop-blur sm:block">
            ⌕ Click to zoom
          </span>
        </div>
      </div>

      <div className="order-2 min-w-0 lg:order-1">
        <GalleryThumbnails images={images} active={active} onSelect={setActive} />
      </div>
    </div>
  );
}
