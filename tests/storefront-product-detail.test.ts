import assert from "node:assert/strict";
import test from "node:test";
import { mapBackendProductToCatalog } from "../lib/catalog-backend";
import { buildProductDetail } from "../lib/product-detail-data";
import type { BackendProduct } from "../types/backend";

const fromDB: BackendProduct = {
  id: "clive789", slug: "verified-store-item", sku: "STORE-2026-1",
  name: "Verified Store Product",
  shortDescription: "Manufacturer supplied short description",
  description: "Actual product description from PostgreSQL",
  priceMinor: 179900, compareAtMinor: null, currency: "INR",
  rating: 0, reviewCount: 0,
  brand: { name: "Store Brand", slug: "store-brand" },
  category: { name: "Electronics", slug: "electronics" },
  images: [
    { url: "https://images.example.invalid/item-1.jpg", alt: "Actual front image" },
    { url: "https://images.example.invalid/item-2.jpg", alt: "Actual back image" },
  ],
  availableStock: 12,
  createdAt: "2026-10-21T01:02:03.000Z",
};

test("database catalog item never inherits demo brand, badges, colors or fictional ETA", () => {
  const item = mapBackendProductToCatalog(fromDB);
  assert.equal(item.source, "database");
  assert.equal(item.badge, undefined);
  assert.equal(item.brand, "Store Brand");
  assert.deepEqual(item.colors, []);
  assert.equal(item.delivery, "Delivery timing at checkout");
  assert.equal(item.liveSku, "STORE-2026-1");
});

test("live product details use exact stored SKU, description and actual image assets", () => {
  const item = buildProductDetail(mapBackendProductToCatalog(fromDB));
  assert.equal(item.sku, fromDB.sku);
  assert.equal(item.subtitle, fromDB.shortDescription);
  assert.equal(item.description, fromDB.description);
  assert.deepEqual(item.images, [
    { src: fromDB.images[0].url, alt: "Actual front image" },
    { src: fromDB.images[1].url, alt: "Actual back image" },
  ]);
  assert.equal(item.specifications[0].items.some(i => i.label === "SKU" && i.value === fromDB.sku), true);
});

test("live product never fabricates a bank offer, voucher, review, clothing size or warranty", () => {
  const detail = buildProductDetail(mapBackendProductToCatalog(fromDB));
  assert.deepEqual(detail.offers, []);
  assert.deepEqual(detail.reviewsList, []);
  assert.deepEqual(detail.sizes, []);
  assert.deepEqual(detail.colorOptions, []);
  assert.doesNotMatch(detail.warranty, /1 year|guaranteed/i);
  assert.doesNotMatch(detail.returnPolicy, /7.day/i);
  assert.doesNotMatch(detail.description, /curated catalogue/i);
  assert.equal(detail.highlights.some(x => x.includes("Tomorrow")), false);
});

test("zero-stock live product correctly displays unavailable without courier date promise", () => {
  const out = buildProductDetail(mapBackendProductToCatalog({
    ...fromDB, images: [], availableStock: 0, shortDescription: null,
  }));
  assert.equal(out.stock, "out-of-stock");
  assert.equal(out.delivery, "Currently unavailable");
  assert.equal(out.images[0].src, "/product-placeholder.svg");
  assert.equal(out.images.length, 1);
  assert.equal(out.subtitle, fromDB.description.slice(0, 160));
});

test("real records never receive demo/speculative cross-selling offers or review counts", () => {
  const noOffer = buildProductDetail(mapBackendProductToCatalog({ ...fromDB, reviewCount: 0 }));
  assert.equal(noOffer.reviewsList.length, 0);
  assert.equal(noOffer.offers.length, 0);
  assert.equal(noOffer.seller, "NEXORA");
});
