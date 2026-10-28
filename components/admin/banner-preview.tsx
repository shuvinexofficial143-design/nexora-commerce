"use client";

import { useState } from "react";
import Image from "next/image";
import { isSupportedPosterUrl } from "@/lib/product-media";

export type BannerDraft = {
  title: string; description: string; imageUrl: string; mobileImageUrl: string;
  ctaText: string; ctaHref: string; categorySlug: string; sortOrder: string; published: boolean;
};

export function BannerPreview({ banner }: { banner: BannerDraft }) {
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [failedUrl, setFailedUrl] = useState("");
  const url = device === "mobile" && banner.mobileImageUrl.trim() ? banner.mobileImageUrl.trim() : banner.imageUrl.trim();
  const show = isSupportedPosterUrl(url) && failedUrl !== url;
  return <section aria-label="Unsaved homepage banner preview" className="space-y-3 rounded-3xl border border-black/10 bg-[#f7f7f2] p-4 md:col-span-2">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h3 className="text-sm font-black">Live homepage preview</h3>
      <div className="flex gap-2">
        {(["desktop","mobile"] as const).map((size) =>
          <button key={size} type="button" onClick={() => setDevice(size)} aria-pressed={device === size}
            className={"rounded-xl px-3 py-1.5 text-xs font-bold " + (device === size ? "bg-black text-white" : "bg-white text-black")}>
            {size === "desktop" ? "Desktop" : "Mobile"}
          </button>)}
      </div>
    </div>
    <div className={"relative mx-auto overflow-hidden rounded-2xl bg-black text-white " + (device === "mobile" ? "max-w-[290px] min-h-[330px]" : "w-full min-h-[250px]")}>
      {show ? <Image src={url} alt="Homepage banner preview" fill sizes={device === "mobile" ? "290px" : "(max-width: 768px) 100vw, 900px"}
        unoptimized className="object-cover opacity-65" onError={() => setFailedUrl(url)} /> :
        <div role="img" aria-label="Banner image unavailable" className="absolute inset-0 flex items-center justify-center bg-[#434344] text-xs font-bold text-white/65">Banner image unavailable</div>}
      <div className="relative flex min-h-[250px] flex-col justify-end gap-2 p-6">
        <p className="text-2xl font-black">{banner.title.trim() || "Banner heading"}</p>
        <p className="max-w-xl text-sm text-white/80">{banner.description.trim() || "Optional banner description"}</p>
        <span className="mt-2 w-fit rounded-full bg-white px-4 py-2 text-xs font-bold text-black">{banner.ctaText.trim() || "Shop now"}</span>
      </div>
    </div>
    <p className="text-[11px] font-semibold text-black/45">Admin-only preview · {banner.published ? "Publish selected" : "Draft selected"} · nothing is saved until you submit. CTA target: {banner.ctaHref || "/shop"}</p>
  </section>;
}
