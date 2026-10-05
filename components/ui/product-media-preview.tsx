"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type Props = {
  image: string;
  alt: string;
  videoUrl?: string;
  youtubeVideoId?: string;
  sizes: string;
  className?: string;
  unavailable?: boolean;
};

export function ProductMediaPreview({
  image,
  alt,
  videoUrl,
  youtubeVideoId,
  sizes,
  className = "",
  unavailable = false,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [visible, setVisible] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const hasVideo = Boolean(videoUrl || youtubeVideoId);

  useEffect(() => {
    if (!hasVideo || !rootRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting && entry.intersectionRatio >= 0.55),
      { threshold: [0, 0.55, 1] },
    );

    observer.observe(rootRef.current);
    return () => observer.disconnect();
  }, [hasVideo]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (visible && !reduceMotion) {
      void video.play().catch(() => undefined);
    } else {
      video.pause();
    }
  }, [visible, videoUrl]);

  return (
    <div ref={rootRef} className="absolute inset-0">
      {videoUrl && !videoFailed ? (
        <video
          ref={videoRef}
          src={videoUrl}
          poster={image}
          muted
          loop
          playsInline
          preload="metadata"
          aria-label={alt}
          onError={() => setVideoFailed(true)}
          className={`h-full w-full object-cover transition duration-500 group-hover:scale-[1.035] ${unavailable ? "grayscale-[35%] opacity-75" : ""} ${className}`}
        />
      ) : youtubeVideoId && visible ? (
        <iframe
          title={`${alt} product video`}
          src={`https://www.youtube-nocookie.com/embed/${youtubeVideoId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${youtubeVideoId}&playsinline=1&rel=0`}
          allow="autoplay; encrypted-media; picture-in-picture"
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          className={`pointer-events-none h-full w-full scale-[1.12] border-0 object-cover ${unavailable ? "grayscale-[35%] opacity-75" : ""}`}
        />
      ) : (
        <Image
          src={image}
          alt={alt}
          fill
          sizes={sizes}
          className={`object-cover transition duration-500 group-hover:scale-[1.035] ${unavailable ? "grayscale-[35%] opacity-75" : ""} ${className}`}
        />
      )}

      {hasVideo ? (
        <span className="pointer-events-none absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-black/72 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-white shadow-sm backdrop-blur sm:bottom-3 sm:left-3 sm:text-[10px]">
          <span aria-hidden>▶</span>
          Video
        </span>
      ) : null}
    </div>
  );
}
