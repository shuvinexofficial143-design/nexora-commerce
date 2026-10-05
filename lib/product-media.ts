const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;

export const DEFAULT_PRODUCT_POSTER =
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80";

export function isHttpUrl(value?: string | null) {
  if (!value) return false;
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export function isDirectVideoUrl(value?: string | null) {
  if (!value) return false;
  const candidate = value.trim();
  if (!isHttpUrl(candidate)) return false;
  return /\.(mp4|webm|ogg|m4v|mov)(?:$|[?#])/i.test(candidate);
}

export function getYouTubeVideoId(value?: string | null) {
  if (!value) return undefined;
  const candidate = value.trim();

  if (YOUTUBE_ID.test(candidate)) return candidate;

  try {
    const url = new URL(candidate);
    const host = url.hostname.replace(/^www\./, "").toLowerCase();
    let id: string | undefined;

    if (host === "youtu.be") {
      id = url.pathname.split("/").filter(Boolean)[0];
    } else if (host === "youtube.com" || host.endsWith(".youtube.com")) {
      if (url.pathname === "/watch") {
        id = url.searchParams.get("v") ?? undefined;
      } else {
        const parts = url.pathname.split("/").filter(Boolean);
        if (["shorts", "embed", "live"].includes(parts[0])) id = parts[1];
      }
    }

    return id && YOUTUBE_ID.test(id) ? id : undefined;
  } catch {
    return undefined;
  }
}

export function getYouTubeThumbnail(videoId?: string | null) {
  return videoId && YOUTUBE_ID.test(videoId)
    ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
    : undefined;
}

export function isSupportedPosterUrl(value?: string | null) {
  if (!value) return false;

  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:") return false;

    const host = url.hostname.toLowerCase();
    return (
      host === "images.unsplash.com" ||
      host === "i.ytimg.com" ||
      host === "res.cloudinary.com" ||
      host.endsWith(".supabase.co")
    );
  } catch {
    return false;
  }
}

export function isSupportedProductVideoUrl(value?: string | null) {
  if (!value) return false;
  return Boolean(getYouTubeVideoId(value) || isDirectVideoUrl(value));
}

export function resolveProductMedia(input: {
  videoUrl?: string | null;
  posterUrl?: string | null;
  useFallbackPoster?: boolean;
}) {
  const videoUrl = input.videoUrl?.trim() || undefined;
  const posterUrl = input.posterUrl?.trim() || undefined;
  const youtubeVideoId = getYouTubeVideoId(videoUrl);

  if (videoUrl && !isSupportedProductVideoUrl(videoUrl)) {
    throw new Error("Use a valid YouTube link or a direct MP4/WebM/OGG/M4V/MOV URL.");
  }

  if (posterUrl && !isSupportedPosterUrl(posterUrl)) {
    throw new Error(
      "Poster image must use HTTPS from Unsplash, YouTube, Cloudinary, or Supabase Storage.",
    );
  }

  const resolvedPoster =
    posterUrl ??
    getYouTubeThumbnail(youtubeVideoId) ??
    (videoUrl && input.useFallbackPoster !== false ? DEFAULT_PRODUCT_POSTER : undefined);

  return { videoUrl, posterUrl: resolvedPoster, youtubeVideoId };
}
