import Image from "next/image";
import type { ProductImage } from "@/types/product-detail";

type Props = {
  images: ProductImage[];
  active: number;
  onSelect: (index: number) => void;
  hasVideo?: boolean;
  videoPoster?: string;
};

export function GalleryThumbnails({
  images,
  active,
  onSelect,
  hasVideo = false,
  videoPoster,
}: Props) {
  const offset = hasVideo ? 1 : 0;

  return (
    <div className="no-scrollbar flex gap-1.5 overflow-x-auto py-1 lg:flex-col lg:gap-2 lg:py-0">
      {hasVideo ? (
        <button
          type="button"
          onClick={() => onSelect(0)}
          aria-label="Show product video"
          className={`relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border-2 bg-black transition sm:h-14 sm:w-14 lg:h-20 lg:w-[72px] lg:rounded-2xl ${
            active === 0 ? "border-black" : "border-transparent opacity-70 hover:opacity-100"
          }`}
        >
          {videoPoster ? (
            <Image src={videoPoster} alt="" fill sizes="80px" className="object-cover opacity-80" />
          ) : null}
          <span className="absolute inset-0 grid place-items-center bg-black/18">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-white text-[11px] text-black shadow-sm">
              ▶
            </span>
          </span>
          <span className="absolute bottom-1 left-1 rounded-full bg-black/75 px-1.5 py-0.5 text-[7px] font-black uppercase tracking-wider text-white">
            Video
          </span>
        </button>
      ) : null}

      {images.map((image, index) => {
        const mediaIndex = index + offset;
        return (
          <button
            type="button"
            key={`${image.src}-${index}`}
            onClick={() => onSelect(mediaIndex)}
            aria-label={`Show image ${index + 1}`}
            className={`relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border-2 bg-[#ecece8] transition sm:h-14 sm:w-14 lg:h-20 lg:w-[72px] lg:rounded-2xl ${
              active === mediaIndex
                ? "border-black"
                : "border-transparent opacity-60 hover:opacity-100"
            }`}
          >
            <Image src={image.src} alt="" fill sizes="80px" className="object-cover" />
          </button>
        );
      })}
    </div>
  );
}
