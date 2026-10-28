#!/usr/bin/env node
// Runs only with a local disposable PostgreSQL instance and an ephemeral QA owner.
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const base = new URL(process.env.NEXORA_QA_BASE_URL || "");
const db = new URL(process.env.DATABASE_URL || "");
const direct = new URL(process.env.DIRECT_URL || "");
const isLocal = (v) => ["127.0.0.1", "localhost", "::1", "[::1]"].includes(v.hostname);
if (!isLocal(base) || base.pathname !== "/" || base.username || base.password ||
  !["http:", "https:"].includes(base.protocol) ||
  ![db,direct].every(v => isLocal(v) && v.pathname === "/nexora_qa" && v.username === "nexora_qa") ||
  process.env.NEXORA_QA_ALLOW_DB_INTEGRATION !== "true" ||
  process.env.NEXT_PUBLIC_CASHFREE_ENABLED !== "false" ||
  !process.env.NEXORA_QA_PLAYWRIGHT_DIR ||
  !process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD ||
  !process.env.ADMIN_OWNER_EMAIL?.endsWith("@example.invalid")) {
  throw new Error("Authenticated browser E2E requires isolated localhost and disposable QA credentials");
}

const evidence = process.env.NEXORA_QA_EVIDENCE_DIR || "/tmp/nexora-admin-qa";
mkdirSync(evidence, { recursive: true });
const { chromium } = await import(pathToFileURL(join(process.env.NEXORA_QA_PLAYWRIGHT_DIR, "node_modules/playwright/index.mjs")).href);
const browser = await chromium.launch({ headless: true });
const suffix = Date.now().toString(36);
const categorySlug = "qa-cat-" + suffix, brandSlug = "qa-brand-" + suffix;
const sku = "QA-E2E-" + suffix.toUpperCase(), name = "QA Product " + suffix;
const img1 = "https://images.unsplash.com/photo-1", img2 = "https://images.unsplash.com/photo-2";
const results = [];
let page;

async function verify(label, fn) {
  try {
    await fn();
    results.push({ label, result: "PASS" });
    console.log("PASS ADMIN BROWSER", label);
  } catch (error) {
    results.push({ label, result: "FAIL", message: String(error) });
    try { await page?.screenshot({ path: join(evidence, label.replace(/[^a-z0-9]/gi, "-") + ".png"), fullPage: true, timeout: 5000 }); } catch {}
    console.error("FAIL ADMIN BROWSER", label, error);
    throw error;
  }
}
async function api(ctx, path, method = "GET", data) {
  const response = await ctx.request.fetch(new URL(path, base).href, {
    method, ...(data === undefined ? {} : { data }), failOnStatusCode: false,
  });
  const value = await response.json();
  assert.equal(response.ok() && value.ok, true, path + ": " + response.status() + " " + JSON.stringify(value));
  return value.data;
}
async function product(ctx) {
  const rows = await api(ctx, "/api/admin-app/products");
  const item = rows.find(v => v.sku === sku);
  assert.ok(item, "QA product missing from owner API");
  return item;
}
async function status(ctx, expected) {
  for (let i = 0; i < 30; i++) {
    const row = await product(ctx);
    if (row.status === expected) return row;
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  throw new Error("Status did not persist: " + expected);
}
async function serverReady() {
  for (let i = 0; i < 45; i++) {
    try {
      const response = await fetch(base, { signal: AbortSignal.timeout(2000) });
      if (response.ok) return;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  throw new Error("Local server health timeout");
}

await serverReady();
try {
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 }, serviceWorkers: "block" });
  page = await ctx.newPage();
  page.setDefaultTimeout(15000);

  await verify("owner-login-and-authorization", async () => {
    assert.equal((await ctx.request.get(new URL("/api/admin-app/products", base).href)).status(), 401);
    await page.goto(new URL("/admin/login", base).href);
    await page.getByPlaceholder("Owner username").fill(process.env.ADMIN_USERNAME);
    await page.locator('input[type="password"]').fill(process.env.ADMIN_PASSWORD);
    await page.getByRole("button", { name: "Open admin panel" }).click();
    await page.waitForURL(/\/admin\/?$/);
    assert.equal((await api(ctx, "/api/admin-app/auth/me")).user.role, "ADMIN");
  });

  await verify("catalog-fixtures-are-owner-authenticated", async () => {
    const c = await api(ctx, "/api/admin-app/catalog/categories", "POST", { name: "QA Category", slug: categorySlug, visible: true });
    await api(ctx, "/api/admin-app/catalog/brands", "POST", { name: "QA Brand", slug: brandSlug, active: true });
    for (const attr of [
      { name: "Storage GB", type: "NUMBER", required: true },
      { name: "Case Color", type: "SELECT", required: true, options: ["Black", "Silver"] },
      { name: "Waterproof", type: "BOOLEAN", required: false },
    ]) await api(ctx, "/api/admin-app/catalog/attributes", "POST", { categoryId: c.id, ...attr });
    await page.goto(new URL("/admin/catalog", base).href);
    await page.getByText(categorySlug, { exact: false }).first().waitFor();
    await page.getByText(brandSlug, { exact: false }).first().waitFor();
  });

  await verify("product-create-required-attributes-in-real-browser", async () => {
    await page.goto(new URL("/admin/products", base).href);
    const panel = page.locator("section").filter({ has: page.getByRole("heading", { name: "Add product" }) }).first();
    const form = panel.locator("form");
    await panel.getByPlaceholder("Gift product").fill(name);
    await panel.getByPlaceholder("NX-GIFT-001").fill(sku);
    await panel.getByPlaceholder("999").fill("1299");
    await form.locator("select").nth(0).selectOption(categorySlug);
    await form.locator("select").nth(1).selectOption(brandSlug);
    const attrs = form.getByRole("group", { name: "Category-specific product attributes" });
    await attrs.getByRole("spinbutton", { name: /Storage GB/ }).waitFor();
    await form.getByRole("button", { name: "Create draft product" }).click();
    assert.ok(await form.locator(":invalid").count() > 0, "Required attribute must block form");
    assert.equal((await api(ctx, "/api/admin-app/products")).some(v => v.sku === sku), false);
    await attrs.getByRole("spinbutton", { name: /Storage GB/ }).fill("128");
    await attrs.getByRole("combobox", { name: /Case Color/ }).selectOption("Black");
    await attrs.getByRole("combobox", { name: /Waterproof/ }).selectOption("false");
    const responsePromise = page.waitForResponse((response) => new URL(response.url()).pathname === "/api/admin-app/products/manage" && response.request().method() === "POST");
    await form.getByRole("button", { name: "Create draft product" }).click();
    const created = await responsePromise;
    const createPayload = await created.json();
    assert.equal(created.status(), 201, "Product API response: " + JSON.stringify(createPayload));
    await page.getByText(name, { exact: true }).first().waitFor();
    const row = await product(ctx);
    assert.equal(row.status, "DRAFT");
    assert.deepEqual(row.attributes, { "storage-gb": 128, "case-color": "Black", waterproof: false });
  });

  await verify("product-edit-media-and-reload", async () => {
    await page.reload();
    let details = page.locator("details").filter({ hasText: name }).first();
    await details.locator("summary").click();
    let form = details.locator("form");
    let attrs = form.getByRole("group", { name: "Category-specific product attributes" });
    await attrs.getByRole("spinbutton", { name: /Storage GB/ }).waitFor();
    assert.equal(await attrs.getByRole("spinbutton", { name: /Storage GB/ }).inputValue(), "128");
    await attrs.getByRole("spinbutton", { name: /Storage GB/ }).fill("256");
    await attrs.getByRole("combobox", { name: /Case Color/ }).selectOption("Silver");
    await form.getByPlaceholder("Poster image URL").fill(img1);
    const gallery = form.getByRole("group", { name: "Product gallery images" });
    await gallery.getByRole("textbox", { name: "Add gallery image URL" }).fill(img1);
    await gallery.getByRole("button", { name: "Add image URL" }).click();
    await gallery.getByRole("textbox", { name: "Add gallery image URL" }).fill(img2);
    await gallery.getByRole("button", { name: "Add image URL" }).click();
    await gallery.getByRole("button", { name: "Move image 2 up" }).click();
    await gallery.getByRole("button", { name: "Move image 1 down" }).click();
    const saveResult = page.waitForResponse((response) => new URL(response.url()).pathname.includes("/api/admin-app/products/") && response.request().method() === "PATCH");
    await form.getByRole("button", { name: "Save changes" }).click();
    const savedResponse = await saveResult;
    const savePayload = await savedResponse.json();
    assert.equal(savedResponse.status(), 200, "Edit API response: " + JSON.stringify(savePayload));
    await page.waitForFunction(async (id) => {
      const result = await (await fetch("/api/admin-app/products")).json();
      const row = result.data?.find(v => v.sku === id);
      return row?.attributes?.["storage-gb"] === 256 && row?.media?.filter(v => v.sortOrder >= 10).length === 2;
    }, sku);
    await page.reload();
    details = page.locator("details").filter({ hasText: name }).first();
    await details.locator("summary").click();
    attrs = details.getByRole("group", { name: "Category-specific product attributes" });
    assert.equal(await attrs.getByRole("spinbutton", { name: /Storage GB/ }).inputValue(), "256");
    assert.equal(await attrs.getByRole("combobox", { name: /Case Color/ }).inputValue(), "Silver");
    const row = await product(ctx);
    assert.equal(row.posterUrl, img1);
    assert.deepEqual(row.media.filter(v => v.sortOrder >= 10).map(v => v.url), [img1, img2]);
  });

  await verify("publish-unpublish-storefront-read-contract", async () => {
    const details = page.locator("details").filter({ hasText: name }).first();
    await details.getByRole("button", { name: "ACTIVE", exact: true }).click();
    const active = await status(ctx, "ACTIVE");
    const publicProduct = await ctx.request.get(new URL("/api/backend/products/" + active.slug, base).href);
    assert.equal(publicProduct.status(), 200);
    assert.equal((await publicProduct.json()).data.sku, sku);
    await details.getByRole("button", { name: "DRAFT", exact: true }).click();
    await status(ctx, "DRAFT");
    const hidden = await ctx.request.get(new URL("/api/backend/products/" + active.slug, base).href);
    assert.equal(hidden.status(), 404);
  });
  await verify("bulk-action-owner-only-validated-and-atomic-revisions", async () => {
    const current = await product(ctx);
    const second = await api(ctx, "/api/admin-app/products/manage", "POST", {
      name: "QA Bulk Companion " + suffix,
      sku: sku + "-B",
      price: 549, status: "DRAFT",
    });
    const products = [
      { id: current.id, updatedAt: current.updatedAt },
      { id: second.id, updatedAt: second.updatedAt.toString() },
    ];
    const url = new URL("/api/admin-app/products/bulk", base).href;
    const anonymous = await browser.newContext();
    try {
      const unauthorized = await anonymous.request.post(url, {
        data: { action: "PUBLISH", products },
      });
      assert.equal(unauthorized.status(), 401, "Anonymous user must never run bulk actions");
    } finally { await anonymous.close(); }
    const invalid = await ctx.request.post(url, {
      data: { action: "DELETE", products },
    });
    assert.equal(invalid.status(), 400, "Deleting products must never be a bulk action");
    const duplicate = await ctx.request.post(url, {
      data: { action: "PUBLISH", products: [products[0], products[0]] },
    });
    assert.equal(duplicate.status(), 400, "Duplicate product IDs must fail validation");

    // One product changes after the user selected it. The stale multi-row request must change NONE.
    await api(ctx, "/api/admin-app/products/" + second.id, "PATCH", { featured: true });
    const stale = await ctx.request.post(url, { data: { action: "PUBLISH", products } });
    assert.equal(stale.status(), 409, "Stale UI selections must reject the entire operation");
    const listAfterConflict = await api(ctx, "/api/admin-app/products");
    assert.equal(listAfterConflict.find((x) => x.id === current.id)?.status, "DRAFT");
    assert.equal(listAfterConflict.find((x) => x.id === second.id)?.status, "DRAFT");
  });

  await verify("bulk-action-real-browser-confirmation-publish-feature-and-audit", async () => {
    const qaSkuPrefix = "QA-E2E-" + suffix.toUpperCase();
    const url = new URL("/api/admin-app/products/bulk", base).href;
    async function useBulk(action, expectedChangeCount) {
      await page.goto(new URL("/admin/products", base).href);
      await page.getByPlaceholder("Search name, SKU, brand…").fill(qaSkuPrefix);
      await page.getByRole("button", { name: "Select first 25 filtered" }).click();
      await page.getByText("2 / 25 selected").waitFor();
      await page.getByRole("combobox", { name: "Bulk product action" }).selectOption(action);
      const request = page.waitForResponse((res) =>
        res.url() === url && res.request().method() === "POST");
      page.once("dialog", (dialog) => void dialog.accept());
      await page.getByRole("button", { name: "Apply bulk action" }).click();
      const response = await request;
      const payload = await response.json();
      assert.equal(response.status(), 200, "Bulk " + action + " returned: " + JSON.stringify(payload));
      assert.equal(payload.data.changed, expectedChangeCount);
      assert.equal(payload.data.requested, 2);
    }

    await useBulk("PUBLISH", 2);
    let rows = (await api(ctx, "/api/admin-app/products")).filter((p) => p.sku.startsWith(qaSkuPrefix));
    assert.equal(rows.length, 2);
    assert.ok(rows.every((p) => p.status === "ACTIVE"));
    await useBulk("FEATURE", 1); // companion was already featured by conflict-precondition test
    rows = (await api(ctx, "/api/admin-app/products")).filter((p) => p.sku.startsWith(qaSkuPrefix));
    assert.ok(rows.every((p) => p.featured));
    await useBulk("UNFEATURE", 2);
    await useBulk("MOVE_TO_DRAFT", 2);
    rows = (await api(ctx, "/api/admin-app/products")).filter((p) => p.sku.startsWith(qaSkuPrefix));
    assert.ok(rows.every((p) => p.status === "DRAFT" && !p.featured));

    const audit = await api(ctx, "/api/admin-app/activity");
    const bulkRecords = audit.filter((event) => String(event.action).startsWith("PRODUCT_BULK_"));
    assert.equal(bulkRecords.length, 7, "Every actual product change must have a durable audit row");
  });


  await verify("unsaved-product-preview-and-image-error-state", async () => {
    await page.route("https://images.unsplash.com/photo-1", route => route.abort());
    await page.goto(new URL("/admin/products", base).href);
    const panel = page.locator("section").filter({ has: page.getByRole("heading", { name: "Add product" }) }).first();
    const preview = panel.getByRole("region", { name: "Live product preview" });
    await panel.getByPlaceholder("Gift product").fill("Unsaved QA preview " + suffix);
    await preview.getByText("Unsaved QA preview " + suffix).waitFor();
    const gallery = panel.getByRole("group", { name: "Product gallery images" });
    await gallery.getByRole("textbox", { name: "Add gallery image URL" }).fill(img1);
    await gallery.getByRole("button", { name: "Add image URL" }).click();
    await preview.getByRole("img", { name: /Image unavailable/ }).waitFor();
    await gallery.locator('input[type="file"]').setInputFiles({
      name: "empty.png", mimeType: "image/png", buffer: Buffer.alloc(0),
    });
    await gallery.getByText("Empty files cannot be uploaded.").waitFor();
    assert.equal((await api(ctx, "/api/admin-app/products")).some(p => p.name === "Unsaved QA preview " + suffix), false);
    await page.unroute("https://images.unsplash.com/photo-1");
  });


  await verify("category-browser-create-hide-edit-archive-restore", async () => {
    const slug = "qa-lifecycle-category-" + suffix;
    await page.goto(new URL("/admin/catalog", base).href);
    const section = page.locator("section").filter({ has: page.getByRole("heading", { name: "Add category" }) }).first();
    const form = section.locator("form").first();
    await form.locator("label").filter({ hasText: "Category name" }).locator("input").fill("QA Lifecycle Category " + suffix);
    await form.locator("label").filter({ hasText: "Slug" }).locator("input").fill(slug);
    const mutation = (verb) => page.waitForResponse(r =>
      new URL(r.url()).pathname.startsWith("/api/admin-app/catalog/categories") && r.request().method() === verb);
    let response = mutation("POST");
    await form.getByRole("button", { name: "Create category" }).click();
    assert.equal((await response).status(), 201);
    const row = () => section.locator(".divide-y > div").filter({ hasText: slug }).first();
    await row().getByRole("button", { name: "Hide" }).waitFor();
    response = mutation("PATCH");
    await row().getByRole("button", { name: "Hide" }).click();
    assert.equal((await response).status(), 200);
    await row().getByRole("button", { name: "Show" }).waitFor();
    response = mutation("PATCH");
    await row().getByRole("button", { name: "Show" }).click();
    assert.equal((await response).status(), 200);
    await row().getByRole("button", { name: "Edit" }).click();
    await form.locator("label").filter({ hasText: "Description" }).locator("textarea").fill("Category lifecycle verified");
    response = mutation("PATCH");
    await form.getByRole("button", { name: "Save category changes" }).click();
    assert.equal((await response).status(), 200);
    page.once("dialog", dialog => void dialog.accept());
    response = mutation("DELETE");
    await row().getByRole("button", { name: "Archive" }).click();
    assert.equal((await response).status(), 200);
    await section.getByLabel("Show archived").check();
    await row().getByRole("button", { name: "Restore" }).waitFor();
    response = mutation("PATCH");
    await row().getByRole("button", { name: "Restore" }).click();
    assert.equal((await response).status(), 200);
    const cat = (await api(ctx, "/api/admin-app/catalog/categories?archived=true")).find(x => x.slug === slug);
    assert.equal(cat.archived, false);
    assert.equal(cat.visible, true);
    assert.equal(cat.description, "Category lifecycle verified");
  });

  await ctx.close();
} finally {
  await browser.close();
  writeFileSync(join(evidence, "results.json"), JSON.stringify({ localOnly: true, qaDatabase: "nexora_qa", results }, null, 2));
}
console.log("ADMIN BROWSER RESULTS", results.filter(v => v.result === "PASS").length, "PASS /", results.filter(v => v.result === "FAIL").length, "FAIL");
