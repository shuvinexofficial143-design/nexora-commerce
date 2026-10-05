export function isDirectVideoUrl(value?: string | null) {
  if (!value) return false;
  return /\.(mp4|webm|ogg|m4v|mov)(?:$|[?#])/i.test(value.trim());
}

export function getYouTubeVideoId(value?: string | null) {
  if (!value) return undefined;
  const candidate = value.trim();

  if (/^[A-Za-z0-9_-]{11}$/.test(candidate)) return candidate;

  try {
    const url = new URL(candidate);
    const host = url.hostname.replace(/^www\./, "").toLowerCase();

    if (host === "youtu.be") {
      return url.pathname.split("/").filter(Boolean)[0];
    }

    if (host === "youtube.com" || host.endsWith(".youtube.com")) {
      if (url.pathname === "/watch") {
        return url.searchParams.get("v") ?? undefined;
      }

      const parts = url.pathname.split("/").filter(Boolean);
      if (["shorts", "embed", "live"].includes(parts[0])) {
        return parts[1];
      }
    }
  } catch {
    return undefined;
  }

  return undefined;
}

export function getYouTubeThumbnail(videoId?: string | null) {
  return videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : undefined;
}

export function isHttpUrl(value?: string | null) {
  if (!value) return false;
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}
