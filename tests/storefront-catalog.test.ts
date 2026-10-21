import assert from "node:assert/strict";
import test from "node:test";
import {
  catalogPageHref, demoCatalogEnabled, parseLiveCatalogQuery, toProductListQuery,
} from "../lib/storefront/catalog-query";

test("real storefront parses multi-category and multi-brand filters with safe bounds", () => {
  const q = parseLiveCatalogQuery({
    category: ["electronics", "home", "electronics", "../admin", "INVALID!"],
    brand: ["auralab", "forme"],
    min: "499.50", max: "5000.25",
    rating: "4", sort: "price-low", page: "2",
    q: "  Bluetooth Speaker   ",
  });
  assert.deepEqual(q.categories, ["electronics", "home"]);
  assert.deepEqual(q.brands, ["auralab", "forme"]);
  assert.equal(q.minPrice, 49950);
  assert.equal(q.maxPrice, 500025);
  assert.equal(q.minRating, 4);
  assert.equal(q.page, 2);
  assert.equal(q.query, "Bluetooth Speaker");
  const db = toProductListQuery(q);
  assert.equal(db.limit, 24);
  assert.equal(db.offset, 24);
  assert.deepEqual(db.categories, ["electronics", "home"]);
});
test("invalid price, rating, page and sort values do not reach database filters", () => {
  const q = parseLiveCatalogQuery({ min: "-1", max: "9999999999999999",
    rating: "9", page: "1e12", sort: "sql;DROP", q: "x".repeat(250) });
  assert.equal(q.minPrice, null);
  assert.equal(q.maxPrice, null);
  assert.equal(q.minRating, null);
  assert.equal(q.page, 1);
  assert.equal(q.sort, "featured");
  assert.equal(q.query.length, 100);
});
test("catalog URL preserves categories, brands and search through pagination", () => {
  const query = parseLiveCatalogQuery({
    category: ["electronics", "home"], brand: "forme", q: "lamp",
    min: "100", rating: "4", sort: "newest", page: "3",
  });
  const url = catalogPageHref("/search", query, 4);
  const parsed = new URL(url, "https://example.test");
  assert.equal(parsed.pathname, "/search");
  assert.deepEqual(parsed.searchParams.getAll("category"), ["electronics", "home"]);
  assert.equal(parsed.searchParams.get("brand"), "forme");
  assert.equal(parsed.searchParams.get("q"), "lamp");
  assert.equal(parsed.searchParams.get("page"), "4");
  assert.equal(parsed.searchParams.get("sort"), "newest");
});
test("preview product data requires explicit environment opt-in", () => {
  const before = process.env.NEXORA_QA_DEMO_CATALOG;
  try {
    delete process.env.NEXORA_QA_DEMO_CATALOG;
    assert.equal(demoCatalogEnabled(), false);
    process.env.NEXORA_QA_DEMO_CATALOG = "1";
    assert.equal(demoCatalogEnabled(), false);
    process.env.NEXORA_QA_DEMO_CATALOG = "true";
    assert.equal(demoCatalogEnabled(), true);
  } finally {
    if (before === undefined) delete process.env.NEXORA_QA_DEMO_CATALOG;
    else process.env.NEXORA_QA_DEMO_CATALOG = before;
  }
});
