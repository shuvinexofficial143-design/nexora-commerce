"use client";

import { useState } from "react";
import Image from "next/image";
import { isSupportedPosterUrl } from "@/lib/product-media";
import { buildProductPreview,type ProductPreviewInput } from "@/lib/admin/product-preview";

export function AdminPreviewImage({ url, alt, compact = false }: { url?: string | null; alt: string; compact?: boolean }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const valid = typeof url === "string" && isSupportedPosterUrl(url);
  const show = valid && failedUrl !== url;
  return <div className={"relative flex items-center justify-center overflow-hidden rounded-xl bg-[#ecece7] " + (compact ? "h-16 w-16 shrink-0" : "aspect-square w-full")}>
    {show ? <Image
      src={url} alt={alt} unoptimized fill sizes={compact ? "64px" : "(max-width: 768px) 100vw, 400px"}
      className="object-cover" onError={() => setFailedUrl(url)}
    /> : <span role="img" aria-label={"Image unavailable: " + alt} className="px-2 text-center text-xs font-bold text-black/40">
      {compact ? "No image" : "Image unavailable"}
    </span>}
  </div>;
}

export function ProductPreviewPanel(props:ProductPreviewInput) {
  const view=buildProductPreview(props);
  const [selected, setSelected] = useState<string | null>(null);
  const photos=view.photos;
  const photo = selected && photos.includes(selected) ? selected : photos[0];
  return <section aria-label="Unsaved product preview" className="rounded-[24px] border border-black/10 bg-white p-4 md:col-span-2">
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
      <h3 className="text-sm font-black">Unsaved product preview</h3>
      <span className="rounded-full bg-amber-100 px-3 py-1 text-[10px] font-black text-amber-900">Admin-only preview · {view.status}</span>
    </div>
    <div className="grid gap-4 sm:grid-cols-[minmax(0,180px)_1fr]">
      <div className="space-y-2">
        <AdminPreviewImage url={photo} alt={view.title} />
        {photos.length > 1 ? <div className="flex flex-wrap gap-2">
          {photos.map((item, index) => <button key={item + index} type="button" aria-label={"Preview image " + (index + 1)}
            onClick={() => setSelected(item)} className={"rounded-xl p-1 " + (photo === item ? "ring-2 ring-black" : "ring-1 ring-black/10")}>
            <AdminPreviewImage url={item} compact alt={"Product image " + (index + 1)} />
          </button>)}
        </div> : null}
      </div>
      <div className="min-w-0 space-y-2">
        <p className="break-words text-lg font-black">{view.title}</p>
        <p className="text-lg font-black">{view.priceLabel}
          {view.compareAtLabel?<span className="ml-2 text-sm font-medium text-black/40 line-through">{view.compareAtLabel}</span>:null}</p>
        <p className="text-xs font-bold text-black/55">{view.stockLabel}</p>
        {view.variantPrice?<p className="text-xs text-black/45">Final price and availability depend on the selected SKU variant. No parent-price discount is implied.</p>:null}
        <p className="max-h-28 overflow-auto whitespace-pre-wrap break-words text-xs leading-5 text-black/55">{view.description}</p>
        {view.videoAttached ? <p className="text-xs font-bold text-black/55">Video attached · preview is visual-only</p> : null}
        <p className="pt-2 text-[11px] font-semibold text-black/40">This preview does not publish the product or change inventory.</p>
      </div>
    </div>
  </section>;
}
