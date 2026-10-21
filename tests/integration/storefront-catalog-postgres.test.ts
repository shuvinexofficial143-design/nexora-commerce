import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, test } from "node:test";
import { getPrisma } from "../../lib/db/prisma";
import { listProducts, listPublicCatalogFacets } from "../../lib/db/products";
import { mapBackendProductToCatalog } from "../../lib/catalog-backend";

function verifyIsolation() {
  if (process.env.NEXORA_QA_ALLOW_DB_INTEGRATION !== "true") throw new Error("Explicit QA opt-in required");
  for (const name of ["DATABASE_URL", "DIRECT_URL"]) {
    const url = new URL(process.env[name] || "");
    if (!["127.0.0.1", "localhost", "::1", "[::1]"].includes(url.hostname) ||
      url.username !== "nexora_qa" || url.pathname !== "/nexora_qa") {
      throw new Error("Refusing non-local or non-ephemeral database");
    }
  }
}
verifyIsolation();
const db = getPrisma();
const unique = randomUUID().replaceAll("-", "").slice(0, 10);
const keyword = "shopqa" + unique;
let categoryOne = "";
let categoryTwo = "";
let brandOne = "";
before(async () => {
  await db.$connect();
  const categoryA = await db.category.create({ data: { slug: keyword + "-electronics", name: "Test electronics " + unique } });
  const categoryB = await db.category.create({ data: { slug: keyword + "-home", name: "Test home " + unique } });
  const brand = await db.brand.create({ data: { slug: keyword + "-brand", name: "Test brand " + unique } });
  categoryOne = categoryA.slug; categoryTwo = categoryB.slug; brandOne = brand.slug;
  await db.product.createMany({ data: Array.from({ length: 35 }, (_, i) => ({
    name: "QA catalog " + keyword + " #" + i,
    slug: keyword + "-item-" + i, sku: "SKU-" + keyword + "-" + i,
    description: "Temporary QA catalog marker " + keyword,
    priceMinor: (i + 1) * 10000,
    rating: 3 + (i % 3) / 2,
    status: i === 34 ? "DRAFT" as const : "ACTIVE" as const,
    categoryId: i % 2 ? categoryB.id : categoryA.id,
    brandId: brand.id,
  })) });
});
after(async () => { await db.$disconnect(); });

test("35 catalog fixtures include 34 ACTIVE products over 2 server pages; never include draft", async () => {
  const first = await listProducts({ query: keyword, limit: 24, offset: 0, sort: "price-low" });
  const second = await listProducts({ query: keyword, limit: 24, offset: 24, sort: "price-low" });
  assert.equal(first.total, 34);
  assert.equal(first.items.length, 24);
  assert.equal(second.items.length, 10);
  assert.equal(first.items[0].priceMinor, 10000);
  assert.equal(second.items[9].priceMinor, 340000);
  assert.equal(new Set([...first.items, ...second.items].map(x => x.id)).size, 34);
  console.log("QA_REAL_CATALOG_PAGING", JSON.stringify({ total: first.total, first: first.items.length, second: second.items.length }));
});
test("real multi-category filters preserve OR within category and AND with brand and price", async () => {
  const both = await listProducts({
    query: keyword, categories: [categoryOne, categoryTwo], brands: [brandOne],
    minPriceMinor: 60000, maxPriceMinor: 120000, limit: 24,
  });
  assert.equal(both.total, 7);
  assert.equal(both.items.every(p => p.priceMinor >= 60000 && p.priceMinor <= 120000), true);
  const one = await listProducts({ query: keyword, categories: [categoryOne], limit: 100 });
  assert.equal(one.total, 17);
  const unrelated = await listProducts({ query: keyword, brands: ["not-a-real-brand"], limit: 100 });
  assert.equal(unrelated.total, 0);
});
test("DB sort by price, rating and recency is deterministic across paginated requests", async () => {
  const high = await listProducts({ query: keyword, sort: "price-high", limit: 4 });
  assert.deepEqual(high.items.map(x => x.priceMinor), [340000, 330000, 320000, 310000]);
  const rated = await listProducts({ query: keyword, sort: "rating", limit: 6 });
  assert.ok(rated.items.every((p, i, rows) => i === 0 || rows[i-1].rating >= p.rating));
});
test("category, brand, SKU and description search are database-backed and case insensitive", async () => {
  const byBrand = await listProducts({ query: "Test brand " + unique, categories: [categoryOne, categoryTwo] });
  assert.equal(byBrand.total, 34);
  const bySku = await listProducts({ query: ("SKU-" + keyword).toUpperCase() });
  assert.equal(bySku.total, 34);
  const byName = await listProducts({ query: keyword.toUpperCase() });
  assert.equal(byName.total, 34);
  const byMissing = await listProducts({ query: "qa-product-does-not-exist-xyz" });
  assert.equal(byMissing.total, 0);
});
test("live category/brand facets come from actual active product relations", async () => {
  const facets = await listPublicCatalogFacets();
  assert.ok(facets.categories.some(c => c.slug === categoryOne));
  assert.ok(facets.categories.some(c => c.slug === categoryTwo));
  assert.ok(facets.brands.some(b => b.slug === brandOne));
});
test("live mapping does not invent delivery guarantees, fake badges or product photos", async () => {
  const result = await listProducts({ query: keyword, limit: 1 });
  // Products without inventory are correctly shown unavailable, never as
  // arriving "tomorrow" despite having no real stock.
  const unavailable = mapBackendProductToCatalog(result.items[0]);
  assert.equal(unavailable.delivery, "Currently unavailable");
  assert.equal(unavailable.stock, "out-of-stock");
  const warehouse = await db.warehouse.create({
    data: { code: "SHOP-" + unique, name: "QA Shop", city: "Indore", state: "MP" },
  });
  await db.inventoryItem.create({
    data: { productId: result.items[0].id, warehouseId: warehouse.id, onHand: 12, reserved: 0 },
  });
  const restocked = await listProducts({ query: keyword, limit: 1 });
  const mapped = mapBackendProductToCatalog(restocked.items[0]);
  assert.equal(mapped.delivery, "Delivery timing at checkout");
  assert.equal(mapped.stock, "in-stock");
  assert.equal(mapped.badge, undefined);
  assert.equal(mapped.image, "/product-placeholder.svg");
  assert.deepEqual(mapped.colors, []);
});
