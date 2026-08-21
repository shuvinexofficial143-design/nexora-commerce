import Image from "next/image";
import type { ProductImage } from "@/types/product-detail";
type Props = { images: ProductImage[]; active: number; onSelect: (index: number) => void };
export function GalleryThumbnails({ images, active, onSelect }: Props) {
  return <div className="no-scrollbar flex gap-2 overflow-x-auto lg:flex-col">{images.map((image, index) => <button type="button" key={`${image.src}-${index}`} onClick={() => onSelect(index)} aria-label={`Show image ${index + 1}`} className={`relative h-20 w-16 shrink-0 overflow-hidden rounded-2xl border-2 bg-[#ecece8] transition ${active === index ? "border-black" : "border-transparent opacity-65 hover:opacity-100"}`}><Image src={image.src} alt="" fill sizes="80px" className="object-cover" /></button>)}</div>;
}
