import assert from "node:assert/strict";
import test from "node:test";
import { calculateCartTotals, clampQuantity } from "../lib/cart-utils";
import { checkoutTotalWithCoupon } from "../lib/checkout/coupon-total";
import { filterCatalogProducts, defaultCatalogFilters, getDiscount } from "../lib/catalog-filter";
import { getYouTubeVideoId, isDirectVideoUrl, isSupportedPosterUrl, resolveProductMedia } from "../lib/product-media";
import type { CatalogProduct } from "../types/catalog";
import type { CartLine } from "../types/cart";

const product: CatalogProduct = {
  id: "p1", slug: "p1", name: "Product 1", brand: "Brand", category: "home", price: 999,
  rating: 4, reviews: 2, image: "/a", colors: [], stock: "low-stock", inventory: 1,
  delivery: "2 days", popularity: 8, createdAt: "2026-10-01", tags: [],
};
const line: CartLine = { id: "p1", slug: "p1", name: "Product 1", brand: "Brand", image: "/a", price: 999, quantity: 1, stock: "low-stock", lineId: "p1::default::default" };

test("quantities normalize before use in totals", () => {
  const normalized = [undefined, NaN, -999, 0, 1.5, 11].map((value) => clampQuantity(value as number));
  assert.deepEqual(normalized, [1, 1, 1, 1, 2, 10]);
  const result = calculateCartTotals([{ ...line, quantity: normalized[4] }]);
  assert.equal(result.itemCount, 2);
  assert.equal(result.subtotal, 1998);
  assert.equal(result.shipping, 0);
});

test("cart and checkout tax agree on exact shipping boundaries", () => {
  for (const subtotal of [0, 1, 998, 999, 1000]) {
    const cart = subtotal ? calculateCartTotals([{ ...line, price: subtotal }]) : calculateCartTotals([]);
    const checkout = checkoutTotalWithCoupon(subtotal, 0);
    assert.equal(checkout.total, cart.total, String(subtotal));
    assert.equal(checkout.shipping, cart.shipping, String(subtotal));
  }
});

test("coupon discounts leave the taxable base nonnegative and prevent overcharge", () => {
  const cart = calculateCartTotals([{ ...line, price: 299 }], "SAVE", 500);
  const checkout = checkoutTotalWithCoupon(299, 50000);
  assert.equal(cart.total, 99);
  assert.equal(checkout.total, 99);
  assert.equal(cart.tax, 0);
  assert.equal(checkout.tax, 0);
});

test("filtering handles unknown categories and empty input safely", () => {
  const filters = { ...defaultCatalogFilters, categories: ["does-not-exist"] };
  assert.deepEqual(filterCatalogProducts([product], filters, "featured"), []);
  assert.deepEqual(filterCatalogProducts([], defaultCatalogFilters, "price-low"), []);
  assert.deepEqual(filterCatalogProducts([product], { ...defaultCatalogFilters, stock: "out-of-stock" }, "featured"), []);
  assert.deepEqual(filterCatalogProducts([product], { ...defaultCatalogFilters, brands: ["Brand"] }, "featured"), [product]);
});

test("discount calculation safely handles zero, equal, and lower compare-at prices", () => {
  assert.equal(getDiscount({ ...product, compareAtPrice: 0 }), 0);
  assert.equal(getDiscount({ ...product, compareAtPrice: 999 }), 0);
  assert.equal(getDiscount({ ...product, compareAtPrice: 500 }), 0);
  assert.equal(getDiscount({ ...product, compareAtPrice: 1499 }), 33);
});

test("media validation rejects lookalike domains, embedded scripts, and insecure schemes", () => {
  const videoId = "dQw4w9WgXcQ";
  for (const fake of ["https://youtu.be.attacker.test/" + videoId, "https://youtube.com.attacker.test/watch?v=" + videoId, "javascript:alert(1)", "data:text/html,hello"]) {
    assert.equal(getYouTubeVideoId(fake), undefined);
  }
  assert.equal(isDirectVideoUrl("https://videos.example/evil.mp4.exe"), false);
  assert.equal(isDirectVideoUrl("ftp://videos.example/safe.mp4"), false);
  assert.equal(isSupportedPosterUrl("https://res.cloudinary.com.attacker.test/photo"), false);
  assert.throws(() => resolveProductMedia({ posterUrl: "data:image/svg+xml,<svg/>" }), /Poster image/);
});
