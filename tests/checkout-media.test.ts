import assert from "node:assert/strict";
import test from "node:test";
import { formatAddress, isIndianPin } from "../lib/checkout-utils";
import {
  DEFAULT_PRODUCT_POSTER,
  getYouTubeThumbnail,
  getYouTubeVideoId,
  isDirectVideoUrl,
  isHttpUrl,
  isSupportedPosterUrl,
  isSupportedProductVideoUrl,
  resolveProductMedia,
} from "../lib/product-media";

test("checkout address formats user fields and handles an empty selection", () => {
  assert.equal(formatAddress(), "No delivery address selected");
  assert.equal(formatAddress({
    id: "1", label: "Home", fullName: "Tester", phone: "9999999999",
    line1: "12 Road", city: "Indore", state: "MP", postalCode: "452001", country: "India",
  }), "12 Road, Indore, MP 452001, India");
});

test("six-digit Indian PIN validation rejects malformed values", () => {
  for (const valid of ["452001", " 452001 "]) assert.equal(isIndianPin(valid), true);
  for (const invalid of ["45201", "4520011", "45A001", "45 2001", ""]) assert.equal(isIndianPin(invalid), false);
});

test("media URLs enforce supported schemes and direct-video extensions", () => {
  assert.equal(isHttpUrl("https://example.com/img.jpg"), true);
  assert.equal(isHttpUrl("http://example.com/img.jpg"), true);
  assert.equal(isHttpUrl("javascript:alert(1)"), false);
  assert.equal(isDirectVideoUrl("https://cdn.example.com/clip.MP4?token=123"), true);
  assert.equal(isDirectVideoUrl("http://cdn.example.com/clip.mp4"), false);
  assert.equal(isDirectVideoUrl("https://cdn.example.com/file.jpg"), false);
  assert.equal(isSupportedProductVideoUrl("https://cdn.example.com/clip.webm"), true);
});

test("YouTube IDs are extracted only from YouTube hosts and supported paths", () => {
  const id = "dQw4w9WgXcQ";
  for (const input of [id, "https://youtu.be/" + id, "https://www.youtube.com/watch?v=" + id, "https://youtube.com/shorts/" + id, "https://youtube.com/embed/" + id]) {
    assert.equal(getYouTubeVideoId(input), id);
  }
  assert.equal(getYouTubeThumbnail(id), "https://i.ytimg.com/vi/" + id + "/hqdefault.jpg");
  assert.equal(getYouTubeVideoId("https://notyoutube.com/watch?v=" + id), undefined);
  assert.equal(getYouTubeVideoId("invalid"), undefined);
});

test("poster URLs must use HTTPS and approved media hosts", () => {
  assert.equal(isSupportedPosterUrl("https://images.unsplash.com/example.jpg"), true);
  assert.equal(isSupportedPosterUrl("https://res.cloudinary.com/demo/image.png"), true);
  assert.equal(isSupportedPosterUrl("https://bucket.supabase.co/storage/v1/object/public/p.jpg"), true);
  assert.equal(isSupportedPosterUrl("http://images.unsplash.com/photo"), false);
  assert.equal(isSupportedPosterUrl("https://images.unsplash.com.evil.test/photo"), false);
});

test("media resolution chooses provided poster, YouTube thumbnail or safe fallback", () => {
  const id = "dQw4w9WgXcQ";
  assert.deepEqual(resolveProductMedia({}), { videoUrl: undefined, posterUrl: undefined, youtubeVideoId: undefined });
  assert.deepEqual(resolveProductMedia({ videoUrl: "https://youtu.be/" + id }), {
    videoUrl: "https://youtu.be/" + id,
    posterUrl: getYouTubeThumbnail(id),
    youtubeVideoId: id,
  });
  assert.equal(resolveProductMedia({ videoUrl: "https://cdn.example.com/demo.mp4" }).posterUrl, DEFAULT_PRODUCT_POSTER);
  assert.equal(resolveProductMedia({ videoUrl: "https://cdn.example.com/demo.mp4", useFallbackPoster: false }).posterUrl, undefined);
  const poster = "https://res.cloudinary.com/demo/poster.jpg";
  assert.equal(resolveProductMedia({ videoUrl: id, posterUrl: poster }).posterUrl, poster);
});

test("unsupported product media fails validation rather than silently accepting URLs", () => {
  assert.throws(() => resolveProductMedia({ videoUrl: "http://example.com/unsafe.mp4" }), /valid YouTube link/);
  assert.throws(() => resolveProductMedia({ posterUrl: "https://example.com/unapproved.png" }), /Poster image/);
});
