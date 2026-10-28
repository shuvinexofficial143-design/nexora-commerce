"use client";

import { useState } from "react";
import Image from "next/image";
import { isSupportedPosterUrl, isSupportedProductVideoUrl } from "@/lib/product-media";

type Props = {
  name: string;
  price: string | number;
  compareAtPrice?: string | number;
  description: string;
  posterUrl?: string | null;
  gallery: string[];
  videoUrl?: string | null;
  status?: string;
};

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

export function ProductPreviewPanel({ name, price, compareAtPrice, description, posterUrl, gallery, videoUrl, status = "DRAFT" }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const photos = [posterUrl, ...gallery].filter((item): item is string => Boolean(item?.trim()));
  const photo = selected && photos.includes(selected) ? selected : photos[0];
  const amount = Number(price);
  const oldPrice = Number(compareAtPrice);
  const currency = (value: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(value);
  return <section aria-label="Live product preview" className="rounded-[24px] border border-black/10 bg-white p-4 md:col-span-2">
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
      <h3 className="text-sm font-black">Product preview</h3>
      <span className="rounded-full bg-amber-100 px-3 py-1 text-[10px] font-black text-amber-900">Admin-only preview · {status}</span>
    </div>
    <div className="grid gap-4 sm:grid-cols-[minmax(0,180px)_1fr]">
      <div className="space-y-2">
        <AdminPreviewImage url={photo} alt={name.trim() || "Product"} />
        {photos.length > 1 ? <div className="flex flex-wrap gap-2">
          {photos.map((item, index) => <button key={item + index} type="button" aria-label={"Preview image " + (index + 1)}
            onClick={() => setSelected(item)} className={"rounded-xl p-1 " + (photo === item ? "ring-2 ring-black" : "ring-1 ring-black/10")}>
            <AdminPreviewImage url={item} compact alt={"Product image " + (index + 1)} />
          </button>)}
        </div> : null}
      </div>
      <div className="min-w-0 space-y-2">
        <p className="break-words text-lg font-black">{name.trim() || "Untitled product"}</p>
        <p className="text-lg font-black">{Number.isFinite(amount) && amount >= 0 && String(price).trim() ? currency(amount) : "Enter a price"}
          {Number.isFinite(oldPrice) && oldPrice > amount && String(compareAtPrice ?? "").trim() ? <span className="ml-2 text-sm font-medium text-black/40 line-through">{currency(oldPrice)}</span> : null}</p>
        <p className="max-h-28 overflow-auto whitespace-pre-wrap break-words text-xs leading-5 text-black/55">{description.trim() || "Product description will appear here."}</p>
        {videoUrl && isSupportedProductVideoUrl(videoUrl) ? <p className="text-xs font-bold text-black/55">Video attached · preview is visual-only</p> : null}
        <p className="pt-2 text-[11px] font-semibold text-black/40">This preview does not publish the product or change inventory.</p>
      </div>
    </div>
  </section>;
}
