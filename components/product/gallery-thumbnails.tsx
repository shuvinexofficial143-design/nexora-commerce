import Image from "next/image";
import type { ProductImage } from "@/types/product-detail";

type Props = {
  images: ProductImage[];
  active: number;
  onSelect: (index: number) => void;
};

export function GalleryThumbnails({ images, active, onSelect }: Props) {
  return (
    <div className="no-scrollbar flex gap-1.5 overflow-x-auto py-1 lg:flex-col lg:gap-2 lg:py-0">
      {images.map((image, index) => (
        <button
          type="button"
          key={`${image.src}-${index}`}
          onClick={() => onSelect(index)}
          aria-label={`Show image ${index + 1}`}
          className={`relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border-2 bg-[#ecece8] transition sm:h-14 sm:w-14 lg:h-20 lg:w-16 lg:rounded-2xl ${
            active === index
              ? "border-black"
              : "border-transparent opacity-60 hover:opacity-100"
          }`}
        >
          <Image src={image.src} alt="" fill sizes="80px" className="object-cover" />
        </button>
      ))}
    </div>
  );
}
