import assert from "node:assert/strict";
import test from "node:test";
import { buildFilterOptions, countActiveFilters, defaultCatalogFilters, filterCatalogProducts, getDiscount } from "../lib/catalog-filter";
import type { CatalogProduct, CatalogFilters, SortOption } from "../types/catalog";

const products: CatalogProduct[] = [
  { id: "1", slug: "a", name: "A", brand: "Alpha", category: "electronics", price: 1000, compareAtPrice: 2000, rating: 4.5, reviews: 10, image: "/a", colors: [], stock: "in-stock", inventory: 15, delivery: "Tomorrow", popularity: 60, createdAt: "2026-01-01", tags: [] },
  { id: "2", slug: "b", name: "B", brand: "Beta", category: "fashion", price: 500, rating: 4.8, reviews: 20, image: "/b", colors: [], stock: "low-stock", inventory: 3, delivery: "2 days", popularity: 80, createdAt: "2026-03-01", tags: [] },
  { id: "3", slug: "c", name: "C", brand: "Alpha", category: "electronics", price: 1500, compareAtPrice: 2000, rating: 4.8, reviews: 50, image: "/c", colors: [], stock: "out-of-stock", inventory: 0, delivery: "Restocking", popularity: 40, createdAt: "2026-02-01", tags: [] },
];

function filtered(overrides: Partial<CatalogFilters> = {}, sort: SortOption = "featured") {
  return filterCatalogProducts(products, { ...defaultCatalogFilters, ...overrides }, sort).map((p) => p.id);
}

test("catalog category, brand, stock and price filters can be combined", () => {
  assert.deepEqual(filtered({ categories: ["electronics"], brands: ["Alpha"], stock: "in-stock", minPrice: 1000, maxPrice: 1400 }), ["1"]);
  assert.deepEqual(filtered({ stock: "out-of-stock" }), ["3"]);
  assert.deepEqual(filtered({ maxPrice: 499 }), []);
  assert.deepEqual(filtered({ minRating: 4.8 }), ["2", "3"]);
});

test("discount calculation handles missing and non-discounted compare prices", () => {
  assert.equal(getDiscount(products[0]), 50);
  assert.equal(getDiscount(products[1]), 0);
  assert.equal(getDiscount({ ...products[0], compareAtPrice: 500 }), 0);
  assert.deepEqual(filtered({ minDiscount: 50 }), ["1"]);
});

test("sort options produce expected deterministic order", () => {
  const expected: Record<SortOption, string[]> = {
    featured: ["2", "1", "3"],
    "price-low": ["2", "1", "3"],
    "price-high": ["3", "1", "2"],
    rating: ["3", "2", "1"],
    newest: ["2", "3", "1"],
    discount: ["1", "3", "2"],
  };
  for (const [sort, ids] of Object.entries(expected)) {
    assert.deepEqual(filtered({}, sort as SortOption), ids, sort);
  }
});

test("filter options count products and keep alphabetic labels", () => {
  assert.deepEqual(buildFilterOptions(products, "brand"), [
    { value: "Alpha", label: "Alpha", count: 2 },
    { value: "Beta", label: "Beta", count: 1 },
  ]);
  assert.deepEqual(buildFilterOptions(products, "category"), [
    { value: "electronics", label: "Electronics", count: 2 },
    { value: "fashion", label: "Fashion", count: 1 },
  ]);
});

test("active filter count includes each category/brand and changed ranges", () => {
  assert.equal(countActiveFilters(defaultCatalogFilters), 0);
  assert.equal(countActiveFilters({
    ...defaultCatalogFilters,
    categories: ["electronics", "fashion"],
    brands: ["Alpha"],
    minPrice: 100,
    minRating: 4,
    stock: "in-stock",
    minDiscount: 15,
  }), 7);
});

test("sorting and filtering do not mutate the source catalog", () => {
  const source = products.map((product) => ({ ...product }));
  filtered({}, "price-high");
  assert.deepEqual(products, source);
});
