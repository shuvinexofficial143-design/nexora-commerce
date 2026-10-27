import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, test } from "node:test";
import { getPrisma } from "../../lib/db/prisma";
import {
  SEARCH_PAGE_SIZE,
  searchStoreProducts, suggestStoreProducts,
} from "../../lib/storefront/product-discovery";
import { GET as suggestRoute } from "../../app/api/storefront/search/suggestions/route";

function guardDisposableDatabase() {
  if (process.env.NEXORA_QA_ALLOW_DB_INTEGRATION !== "true") throw new Error("No QA opt-in");
  for (const source of ["DATABASE_URL", "DIRECT_URL"]) {
    const url = new URL(process.env[source] || "");
    if (!["localhost", "127.0.0.1", "::1", "[::1]"].includes(url.hostname)
      || url.pathname !== "/nexora_qa" || url.username !== "nexora_qa") {
      throw new Error("Storefront Search integration only permits disposable local PostgreSQL");
    }
  }
}
guardDisposableDatabase();
const db = getPrisma();
const id = randomUUID().replaceAll("-", "").slice(0, 10);
const prefix = "qa-search-" + id;

before(async () => {
  await db.$connect();
  const category = await db.category.create({
    data: { name: "Kitchen Utensils " + id, slug: prefix + "-kitchen" },
  });
  const brand = await db.brand.create({
    data: { name: "Solarite " + id, slug: prefix + "-solarite" },
  });
  await db.product.createMany({
    data: Array.from({ length: 121 }, (_, index) => ({
      slug: `${prefix}-bottle-${index}`,
      sku: `SEARCH-${id}-${index}`,
      name: `Glimmer ${id} Bottle ${index}`,
      description: "Search only isolated QA product",
      priceMinor: 9900 + index,
      categoryId: category.id,
      brandId: brand.id,
      status: "ACTIVE" as const,
    })),
  });
  await db.product.create({
    data: {
      slug: prefix + "-draft", sku: `SEARCH-${id}-DRAFT`, name: `Glimmer ${id} Secret Draft`,
      description: "Never display drafts", status: "DRAFT",
      categoryId: category.id, brandId: brand.id, priceMinor: 12345,
    },
  });
});
after(async () => { await db.$disconnect(); });

test("real SQL search finds active matches beyond old 100-product catalog limit", async () => {
  const match = await searchStoreProducts("Glimmer " + id, 1);
  assert.equal(match.total, 121);
  assert.equal(match.products.length, SEARCH_PAGE_SIZE);
  assert.equal(match.totalPages, 7);
  assert.ok(match.products.every((p) => p.name.includes(id)));
  assert.ok(match.products.every((p) => p.stock === "out-of-stock"));
});

test("last page is stable, duplicate-free, and pages past the end clamp", async () => {
  const first = await searchStoreProducts("Glimmer " + id, 1);
  const second = await searchStoreProducts("Glimmer " + id, 2);
  const last = await searchStoreProducts("Glimmer " + id, 999);
  assert.equal(last.page, 7);
  assert.equal(last.products.length, 13);
  assert.equal(new Set([...first.products, ...second.products].map(p => p.id)).size, 36);
});

test("multi-token search matches across product name, category and brand", async () => {
  const match = await searchStoreProducts("Solarite Kitchen " + id, 1);
  assert.equal(match.total, 121);
  const missing = await searchStoreProducts("Solarite Phone " + id, 1);
  assert.equal(missing.total, 0);
  assert.equal(missing.products.length, 0);
});

test("suggestions expose minimal catalog fields, only active products, at most seven", async () => {
  const items = await suggestStoreProducts("Glimmer " + id);
  assert.equal(items.length, 7);
  assert.ok(items.every((item) => item.category?.includes("Kitchen Utensils")));
  assert.ok(items.every((item) => !item.name.includes("Secret")));
  assert.ok(items.every((item) => !("description" in item) && !("inventory" in item)));
  const response = await suggestRoute(new Request(
    "http://localhost:3137/api/storefront/search/suggestions?q=" + encodeURIComponent("Glimmer " + id),
  ));
  assert.equal(response.status, 200);
  const json = await response.json() as { ok: boolean; data: Array<{ slug: string }> };
  assert.equal(json.ok, true);
  assert.equal(json.data.length, 7);
});

test("live SKU-only search and suggestions use active variant price and reserved stock", async () => {
  const product = await db.product.create({ data: {
    slug: prefix + "-real-variant", sku: "BASE-REAL-" + id,
    name: "Real SKU candidate " + id, description: "Published isolated SKU search fixture",
    status: "ACTIVE", priceMinor: 99000,
  } });
  await db.productVariant.create({ data: {
    productId: product.id, sku: "LIVE-" + id + "-RED",
    choices: { colour: "red" }, signature: JSON.stringify({ colour: "red" }),
    priceMinor: 19900, onHand: 7, reserved: 2, active: true,
  } });
  await db.productVariant.create({ data: {
    productId: product.id, sku: "OLD-" + id + "-BLUE",
    choices: { colour: "blue" }, signature: JSON.stringify({ colour: "blue" }),
    priceMinor: 100, onHand: 10, reserved: 0, active: false,
  } });
  const liveSku = "LIVE-" + id + "-RED";
  const full = await searchStoreProducts(liveSku.toLowerCase(), 1);
  assert.equal(full.total, 1);
  assert.equal(full.products[0].id, product.id);
  assert.equal(full.products[0].price, 199);
  assert.equal(full.products[0].inventory, 5);
  assert.equal(full.products[0].stock, "low-stock");
  assert.equal(full.products[0].hasPricedVariants, true);
  assert.equal(full.products[0].liveVariants?.length, 1);
  assert.equal(full.products[0].liveVariants?.[0].sku, liveSku);
  const suggested = await suggestStoreProducts(liveSku);
  assert.equal(suggested.length, 1);
  assert.equal(suggested[0].priceMinor, 19900);
  assert.equal(suggested[0].available, true);
  assert.ok(!("inventory" in suggested[0]) && !("variants" in suggested[0]));
  assert.equal((await searchStoreProducts("OLD-" + id + "-BLUE", 1)).total, 0);
  assert.deepEqual(await suggestStoreProducts("OLD-" + id + "-BLUE"), []);
  const variant = await db.productVariant.findUniqueOrThrow({ where: { sku: liveSku } });
  await db.productVariant.update({ where: { id: variant.id }, data: { onHand: 2 } });
  const soldOut = await searchStoreProducts(liveSku, 1);
  assert.equal(soldOut.total, 1);
  assert.equal(soldOut.products[0].inventory, 0);
  assert.equal(soldOut.products[0].stock, "out-of-stock");
  const soldOutSuggestion = await suggestStoreProducts(liveSku);
  assert.equal(soldOutSuggestion[0].available, false);
  assert.equal(soldOutSuggestion[0].priceMinor, 19900);
});
