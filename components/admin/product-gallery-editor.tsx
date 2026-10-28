"use client";

import { useState } from "react";
import Image from "next/image";
import { AdminMediaUpload } from "@/components/admin/admin-media-upload";
import { isSupportedPosterUrl } from "@/lib/product-media";

type Props = {
  value: string[];
  onChange: (urls: string[]) => void;
  disabled?: boolean;
};

export function ProductGalleryEditor({ value, onChange, disabled = false }: Props) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");

  function add(candidate: string) {
    const normalized = candidate.trim();
    if (!isSupportedPosterUrl(normalized)) {
      setError("Use an approved HTTPS Unsplash, YouTube thumbnail, Cloudinary or Supabase image URL.");
      return;
    }
    if (value.includes(normalized)) {
      setError("This gallery image is already added.");
      return;
    }
    if (value.length >= 20) {
      setError("A product may have up to 20 additional gallery images.");
      return;
    }
    onChange([...value, normalized]);
    setUrl("");
    setError("");
  }

  function move(index: number, delta: number) {
    const next = [...value];
    const other = index + delta;
    if (other < 0 || other >= next.length) return;
    [next[index], next[other]] = [next[other], next[index]];
    onChange(next);
  }

  return (
    <fieldset disabled={disabled} className="space-y-3 rounded-2xl border border-black/10 bg-[#fafaf7] p-4 md:col-span-2">
      <legend className="px-2 text-sm font-black">Product gallery images</legend>
      <p className="text-xs text-black/55">Up to 20 extra images. Reorder with arrows; poster and video are saved separately. Saved images appear in the live product gallery.</p>
      <div className="flex flex-wrap gap-2">
        <input
          aria-label="Add gallery image URL"
          className="min-w-[220px] flex-1 rounded-xl border border-black/15 bg-white px-3 py-2 text-sm"
          type="url"
          value={url}
          placeholder="Paste approved HTTPS image URL"
          onChange={(event) => setUrl(event.target.value)}
        />
        <button
          type="button"
          disabled={disabled}
          className="rounded-xl bg-black px-4 py-2 text-xs font-black text-white disabled:opacity-50"
          onClick={() => add(url)}
        >
          Add image URL
        </button>
      </div>
      <AdminMediaUpload resourceType="image" label="Upload gallery image" onUploaded={add} />
      {error ? <p role="alert" className="text-xs font-bold text-red-700">{error}</p> : null}
      {!value.length ? <p className="text-xs text-black/45">No extra images added yet.</p> : null}
      <div className="grid gap-2 sm:grid-cols-2">
        {value.map((item, i) => (
          <div key={item} className="flex items-center gap-3 rounded-xl border border-black/10 bg-white p-2">
            <Image src={item} alt={"Product gallery image " + (i + 1)} width={64} height={64} unoptimized className="h-16 w-16 shrink-0 rounded-lg object-cover" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold">Image {i + 1}</p>
              <p className="truncate text-[10px] text-black/45" title={item}>{item}</p>
              <div className="mt-1 flex flex-wrap gap-2">
                <button type="button" aria-label={"Move image " + (i + 1) + " up"} disabled={disabled || i === 0} onClick={() => move(i, -1)} className="text-xs font-black disabled:opacity-25">↑</button>
                <button type="button" aria-label={"Move image " + (i + 1) + " down"} disabled={disabled || i === value.length - 1} onClick={() => move(i, 1)} className="text-xs font-black disabled:opacity-25">↓</button>
                <button type="button" aria-label={"Remove image " + (i + 1)} disabled={disabled} onClick={() => onChange(value.filter((v) => v !== item))} className="text-xs font-black text-red-700">Remove</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </fieldset>
  );
}
