import assert from "node:assert/strict";
import test from "node:test";
import { validateBanner } from "../lib/home-banners";

const base = {
  title: "Autumn Sale", description: "Seasonal collection",
  imageUrl: "https://images.unsplash.com/photo-1234", mobileImageUrl: "",
  ctaText: "Explore", ctaHref: "/shop", categorySlug: "Gifts", sortOrder: 3,
  published: false, archived: false,
};

test("homepage banner accepts approved images and internal CTA with stable draft settings", () => {
  const banner = validateBanner(base);
  assert.equal(banner.ctaHref, "/shop");
  assert.equal(banner.categorySlug, "gifts");
  assert.equal(banner.sortOrder, 3);
  assert.equal(banner.published, false);
});
test("homepage banner blocks unsafe images, cross-origin links, invalid order and archive-published conflict", () => {
  for (const value of ["http://images.unsplash.com/photo-1234", "https://evil.example/pixel.png", "javascript:alert(1)", "//evil.example/a"]) {
    assert.throws(() => validateBanner({ ...base, imageUrl: value }), /Banner image must use approved HTTPS|CTA/);
  }
  for (const href of ["//evil.example/redirect", "/\\evil.example", "https://evil.example", "/a\nlocation"]) {
    assert.throws(() => validateBanner({ ...base, ctaHref: href }), /internal CTA link/);
  }
  for (const order of [-1, 0.5, "12", 100001]) {
    assert.throws(() => validateBanner({ ...base, sortOrder: order }), /Display order must/);
  }
  assert.equal(validateBanner({ ...base, archived: true, published: true }).published, false);
});
