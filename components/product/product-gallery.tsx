"use client";

import Image from "next/image";
import { useState } from "react";
import type { ProductImage } from "@/types/product-detail";
import { GalleryThumbnails } from "@/components/product/gallery-thumbnails";

type Props = {
  images: ProductImage[];
  badge?: string;
  videoUrl?: string;
  youtubeVideoId?: string;
  videoPoster?: string;
};

export function ProductGallery({
  images,
  badge,
  videoUrl,
  youtubeVideoId,
  videoPoster,
}: Props) {
  const hasVideo = Boolean(videoUrl || youtubeVideoId);
  const [active, setActive] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const showingVideo = hasVideo && active === 0;
  const imageIndex = hasVideo ? Math.max(0, active - 1) : active;
  const image = images[imageIndex] ?? images[0];
  const poster = videoPoster ?? image?.src;

  return (
    <div className="grid min-w-0 gap-2 lg:grid-cols-[78px_minmax(0,1fr)] lg:gap-3">
      <div className="order-1 lg:order-2">
        <div className="relative h-[58dvh] min-h-[360px] max-h-[720px] overflow-hidden rounded-[24px] bg-[#11110f] sm:h-auto sm:min-h-0 sm:max-h-none sm:aspect-[4/5] sm:rounded-[32px] lg:rounded-[38px]">
          {showingVideo ? (
            <>
              {videoUrl ? (
                <video
                  src={videoUrl}
                  poster={poster}
                  controls
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  className="h-full w-full object-cover"
                />
              ) : youtubeVideoId ? (
                <iframe
                  title="Product video"
                  src={`https://www.youtube-nocookie.com/embed/${youtubeVideoId}?autoplay=1&mute=1&playsinline=1&rel=0`}
                  allow="autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                  className="h-full w-full border-0"
                />
              ) : null}

              <div className="pointer-events-none absolute left-3 top-3 z-20 flex items-center gap-2">
                {badge ? (
                  <span className="rounded-full bg-[#d7ff47] px-2.5 py-1 text-[9px] font-black uppercase tracking-wide text-black sm:px-3 sm:py-1.5 sm:text-[11px]">
                    {badge}
                  </span>
                ) : null}
                <span className="rounded-full bg-black/70 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-white backdrop-blur sm:px-3 sm:py-1.5 sm:text-[10px]">
                  ▶ Product video
                </span>
              </div>
            </>
          ) : image ? (
            <>
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
            </>
          ) : null}
        </div>
      </div>

      <div className="order-2 min-w-0 lg:order-1">
        <GalleryThumbnails
          images={images}
          active={active}
          onSelect={(index) => {
            setActive(index);
            setZoomed(false);
          }}
          hasVideo={hasVideo}
          videoPoster={poster}
        />
      </div>
    </div>
  );
}
