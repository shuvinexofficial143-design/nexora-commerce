import assert from "node:assert/strict";
import test from "node:test";
import { GET as suggest } from "../app/api/storefront/search/suggestions/route";
import {
  buildProductSearchWhere, demoSearchEnabled, normalizeSearchPage,
  normalizeStoreSearch, searchTerms,
} from "../lib/storefront/product-discovery";

test("search trims, bounds and tokenizes customer queries", () => {
  assert.equal(normalizeStoreSearch("  Electronics   Camera  "), "Electronics Camera");
  assert.equal(normalizeStoreSearch("a".repeat(200)).length, 80);
  assert.equal(normalizeStoreSearch(null), "");
  assert.deepEqual(searchTerms("Electronics Camera"), ["electronics", "camera"]);
  assert.deepEqual(searchTerms("   a  "), []);
  assert.equal(searchTerms("one two three four five six seven eight nine").length, 8);
});

test("database search requires active products, and token filters match brand and category", () => {
  const where = buildProductSearchWhere(" Sony  Camera ");
  assert.equal(where.status, "ACTIVE");
  assert.equal(where.AND.length, 2);
  assert.equal(where.AND[0].OR.length, 7);
  const serialized = JSON.stringify(where);
  assert.match(serialized, /"contains":"sony"/);
  assert.match(serialized, /"contains":"camera"/);
  assert.match(serialized, /"brand":\{"is":\{"name":/);
  assert.match(serialized, /"category":\{"is":\{"name":/);
});

test("search pagination clamps malformed, negative and high page values", () => {
  assert.equal(normalizeSearchPage("2"), 2);
  assert.equal(normalizeSearchPage("00002"), 1);
  assert.equal(normalizeSearchPage("-1"), 1);
  assert.equal(normalizeSearchPage("999"), 100);
  assert.equal(normalizeSearchPage("Infinity"), 1);
});

test("demo mode must be explicitly opted in and must have no live database", (t) => {
  const oldDemo = process.env.NEXORA_QA_DEMO_CATALOG;
  const oldDatabase = process.env.DATABASE_URL;
  t.after(() => {
    if (oldDemo === undefined) delete process.env.NEXORA_QA_DEMO_CATALOG;
    else process.env.NEXORA_QA_DEMO_CATALOG = oldDemo;
    if (oldDatabase === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = oldDatabase;
  });
  process.env.NEXORA_QA_DEMO_CATALOG = "true";
  process.env.DATABASE_URL = "postgresql://user:password@db.example.com:5432/prod";
  assert.equal(demoSearchEnabled(), false);
  process.env.DATABASE_URL = "";
  assert.equal(demoSearchEnabled(), true);
  process.env.NEXORA_QA_DEMO_CATALOG = "false";
  assert.equal(demoSearchEnabled(), false);
});

test("search suggestions reject oversized input without reaching the database", async () => {
  const res = await suggest(new Request("http://localhost:3137/api/storefront/search/suggestions?q=" + "a".repeat(180)));
  assert.equal(res.status, 400);
  assert.equal((await res.json()).ok, false);
});

test("short search queries safely return empty suggestions without database access", async () => {
  const res = await suggest(new Request("http://localhost:3137/api/storefront/search/suggestions?q=x"));
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { ok: true, data: [] });
});
