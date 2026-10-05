"use client";

import { useRef, useState } from "react";

type UploadSignature = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  signature: string;
  resourceType: "image" | "video";
};

type Props = {
  resourceType: "image" | "video";
  onUploaded: (url: string) => void;
  label?: string;
};

const limits = {
  image: 10 * 1024 * 1024,
  video: 100 * 1024 * 1024,
};

export function AdminMediaUpload({
  resourceType,
  onUploaded,
  label,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  async function getSignature() {
    const response = await fetch("/api/admin-app/media/sign", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resourceType }),
    });

    const payload = (await response.json().catch(() => null)) as
      | { ok?: boolean; data?: UploadSignature; error?: string }
      | null;

    if (!response.ok || !payload?.ok || !payload.data) {
      throw new Error(payload?.error || "Could not prepare upload.");
    }

    return payload.data;
  }

  function uploadDirect(file: File, signature: UploadSignature) {
    return new Promise<string>((resolve, reject) => {
      const form = new FormData();
      form.append("file", file);
      form.append("api_key", signature.apiKey);
      form.append("timestamp", String(signature.timestamp));
      form.append("folder", signature.folder);
      form.append("signature", signature.signature);

      const xhr = new XMLHttpRequest();
      xhr.open(
        "POST",
        `https://api.cloudinary.com/v1_1/${encodeURIComponent(
          signature.cloudName,
        )}/${signature.resourceType}/upload`,
      );

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          setProgress(Math.round((event.loaded / event.total) * 100));
        }
      };

      xhr.onerror = () => reject(new Error("Upload connection failed."));
      xhr.onload = () => {
        const payload = (() => {
          try {
            return JSON.parse(xhr.responseText) as {
              secure_url?: string;
              error?: { message?: string };
            };
          } catch {
            return null;
          }
        })();

        if (
          xhr.status < 200 ||
          xhr.status >= 300 ||
          !payload?.secure_url
        ) {
          reject(
            new Error(
              payload?.error?.message || "Cloudinary upload failed.",
            ),
          );
          return;
        }

        resolve(payload.secure_url);
      };

      xhr.send(form);
    });
  }

  async function choose(file?: File) {
    if (!file) return;

    setError("");
    setProgress(0);

    const expected =
      resourceType === "video"
        ? file.type.startsWith("video/")
        : file.type.startsWith("image/");

    if (!expected) {
      setError(
        resourceType === "video"
          ? "Choose a video file."
          : "Choose an image file.",
      );
      return;
    }

    if (file.size > limits[resourceType]) {
      setError(
        resourceType === "video"
          ? "Video must be 100 MB or smaller."
          : "Image must be 10 MB or smaller.",
      );
      return;
    }

    setBusy(true);
    try {
      const signature = await getSignature();
      const url = await uploadDirect(file, signature);
      onUploaded(url);
      setProgress(100);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Upload failed.",
      );
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="mt-2">
      <input
        ref={inputRef}
        type="file"
        accept={resourceType === "video" ? "video/*" : "image/*"}
        className="hidden"
        onChange={(event) => void choose(event.target.files?.[0])}
      />

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="rounded-full border border-black/10 bg-white px-3.5 py-2 text-xs font-black transition hover:bg-black hover:text-white disabled:cursor-wait disabled:opacity-50"
        >
          {busy
            ? `Uploading ${progress}%`
            : label ??
              (resourceType === "video"
                ? "Upload video"
                : "Upload image")}
        </button>

        <span className="text-[11px] font-bold text-black/35">
          {resourceType === "video"
            ? "Direct upload · max 100 MB"
            : "Direct upload · max 10 MB"}
        </span>
      </div>

      {busy ? (
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/8">
          <div
            className="h-full rounded-full bg-black transition-[width]"
            style={{ width: `${progress}%` }}
          />
        </div>
      ) : null}

      {error ? (
        <p className="mt-2 text-xs font-bold text-red-700">{error}</p>
      ) : null}
    </div>
  );
}
