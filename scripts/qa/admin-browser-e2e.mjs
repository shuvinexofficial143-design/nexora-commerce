#!/usr/bin/env node
// Runs only with a local disposable PostgreSQL instance and an ephemeral QA owner.
import assert from "node:assert/strict";
import pg from "pg";
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
    const section = page.locator(".grid.items-start.gap-6 > section").first();
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


  await verify("brand-browser-create-edit-deactivate-reactivate", async () => {
    const slug = "qa-lifecycle-brand-" + suffix;
    await page.goto(new URL("/admin/catalog", base).href);
    const section = page.locator(".grid.items-start.gap-6 > section").nth(1);
    const form = section.locator("form").first();
    await form.locator("label").filter({ hasText: "Brand name" }).locator("input").fill("QA Lifecycle Brand " + suffix);
    await form.locator("label").filter({ hasText: "Slug" }).locator("input").fill(slug);
    const mutation = (verb) => page.waitForResponse(r =>
      new URL(r.url()).pathname.startsWith("/api/admin-app/catalog/brands") && r.request().method() === verb);
    let response = mutation("POST");
    await form.getByRole("button", { name: "Create brand" }).click();
    assert.equal((await response).status(), 201);
    const row = () => section.locator(".divide-y > div").filter({ hasText: slug }).first();
    await row().getByRole("button", { name: "Edit" }).waitFor();
    await row().getByRole("button", { name: "Edit" }).click();
    await form.locator("label").filter({ hasText: "Description" }).locator("textarea").fill("Brand lifecycle verified");
    response = mutation("PATCH");
    await form.getByRole("button", { name: "Save brand changes" }).click();
    assert.equal((await response).status(), 200);
    page.once("dialog", dialog => void dialog.accept());
    response = mutation("DELETE");
    await row().getByRole("button", { name: "Deactivate" }).click();
    assert.equal((await response).status(), 200);
    await row().getByRole("button", { name: "Activate" }).waitFor();
    response = mutation("PATCH");
    await row().getByRole("button", { name: "Activate" }).click();
    assert.equal((await response).status(), 200);
    const brand = (await api(ctx, "/api/admin-app/catalog/brands?inactive=true")).find(x => x.slug === slug);
    assert.equal(brand.active, true);
    assert.equal(brand.description, "Brand lifecycle verified");
  });


  await verify("bulk-audit-write-failure-rolls-back-all-products", async () => {
    const dbClient = new pg.Client({ connectionString: process.env.DATABASE_URL });
    await dbClient.connect();
    let triggerCreated = false;
    try {
      await dbClient.query("CREATE FUNCTION qa_reject_bulk_audit() RETURNS trigger AS $qafunc$ BEGIN RAISE EXCEPTION 'QA audit insert rejected'; END; $qafunc$ LANGUAGE plpgsql");
      await dbClient.query('CREATE TRIGGER qa_reject_bulk_audit_trg BEFORE INSERT ON "AdminActivityLog" FOR EACH ROW WHEN (NEW."action" = \'PRODUCT_BULK_FEATURE\') EXECUTE FUNCTION qa_reject_bulk_audit()');
      triggerCreated = true;
      const original = await product(ctx);
      assert.equal(original.status, "DRAFT");
      assert.equal(original.featured, false);
      const countBefore = await dbClient.query('SELECT count(*)::int AS count FROM "AdminActivityLog" WHERE "entityId" = $1', [original.id]);
      const result = await ctx.request.post(new URL("/api/admin-app/products/bulk", base).href, {
        data: { action: "FEATURE", products: [{ id: original.id, updatedAt: original.updatedAt }] },
      });
      assert.equal(result.status(), 500, "Audit trigger rejection should fail the product transaction");
      const unchanged = await product(ctx);
      assert.equal(unchanged.featured, false);
      assert.equal(unchanged.updatedAt, original.updatedAt);
      const countAfter = await dbClient.query('SELECT count(*)::int AS count FROM "AdminActivityLog" WHERE "entityId" = $1', [original.id]);
      assert.equal(countAfter.rows[0].count, countBefore.rows[0].count, "Rolled-back activity must not persist");
    } finally {
      if (triggerCreated) await dbClient.query('DROP TRIGGER IF EXISTS qa_reject_bulk_audit_trg ON "AdminActivityLog"');
      await dbClient.query("DROP FUNCTION IF EXISTS qa_reject_bulk_audit()");
      await dbClient.end();
    }
  });

  await verify("concurrent-bulk-actions-allow-only-one-stale-revision-winner", async () => {
    const original = await product(ctx);
    assert.equal(original.featured, false);
    assert.equal(original.status, "DRAFT");
    const products = [{ id: original.id, updatedAt: original.updatedAt }];
    const url = new URL("/api/admin-app/products/bulk", base).href;
    const responses = await Promise.all([
      ctx.request.post(url, { data: { action: "PUBLISH", products } }),
      ctx.request.post(url, { data: { action: "FEATURE", products } }),
    ]);
    assert.deepEqual(responses.map(r => r.status()).sort((a,b) => a - b), [200,409],
      "Only one transaction may commit when two actions share a revision");
    const after = await product(ctx);
    assert.equal(Number(after.status === "ACTIVE") + Number(after.featured === true), 1,
      "A stale concurrent update must never alter the second field");
  });

  await verify("media-signer-disabled-and-mocked-cloudinary-upload-error", async () => {
    const signer = await ctx.request.post(new URL("/api/admin-app/media/sign", base).href, {
      data: { resourceType: "image" },
    });
    assert.equal(signer.status(), 503, "QA has no external Cloudinary credentials");
    await page.goto(new URL("/admin/products", base).href);
    const panel = page.locator("section").filter({ has: page.getByRole("heading", { name: "Add product" }) }).first();
    const gallery = panel.getByRole("group", { name: "Product gallery images" });
    const file = { name: "qa-image.png", mimeType: "image/png", buffer: Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]) };
    await gallery.locator('input[type="file"]').setInputFiles(file);
    await gallery.getByText("Cloudinary upload is not configured yet.").waitFor();
    await page.route("**/api/admin-app/media/sign", route => route.fulfill({
      status: 200, contentType: "application/json",
      body: JSON.stringify({ ok: true, data: {
        cloudName: "nexora-qa-only", apiKey: "qa", timestamp: 123456,
        folder: "nexora/products/images", signature: "qa-test-only", resourceType: "image",
      } }),
    }));
    await page.route("https://api.cloudinary.com/**", route => route.fulfill({
      status: route.request().method() === "OPTIONS" ? 204 : 503,
      contentType: "application/json",
      headers: { "access-control-allow-origin": "*", "access-control-allow-methods": "POST, OPTIONS", "access-control-allow-headers": "*" },
      body: route.request().method() === "OPTIONS" ? "" : JSON.stringify({ error: { message: "QA upload service unavailable" } }),
    }));
    try {
      await gallery.locator('input[type="file"]').setInputFiles(file);
      await gallery.getByText("QA upload service unavailable").waitFor();
      assert.equal(await gallery.getByText("No extra images added yet.").count(), 1);
    } finally {
      await page.unroute("**/api/admin-app/media/sign");
      await page.unroute("https://api.cloudinary.com/**");
    }
  });

  await verify("homepage-banner-live-preview-save-publish-archive-and-restore", async () => {
    const bannerTitle = "QA Live Hero " + suffix;
    await page.goto(new URL("/admin/homepage", base).href);
    const form = page.locator("form").filter({ hasText: "Create homepage banner" }).first();
    await form.getByLabel("Title", { exact: true }).fill(bannerTitle);
    await form.getByLabel("Desktop image URL").fill(img1);
    const preview = page.getByRole("region", { name: "Unsaved homepage banner preview" });
    await preview.getByText(bannerTitle).waitFor();
    await preview.getByRole("button", { name: "Mobile" }).click();
    await preview.getByText(bannerTitle).waitFor();
    const before = await api(ctx, "/api/admin-app/banners");
    assert.equal(before.some(x => x.title === bannerTitle), false, "Unsaved preview must not persist");
    const response = page.waitForResponse(r => new URL(r.url()).pathname === "/api/admin-app/banners" && r.request().method() === "POST");
    await form.getByRole("button", { name: "Create banner" }).click();
    assert.equal((await response).status(), 201);
    const findRow = () => page.getByText(bannerTitle, { exact: true }).last().locator("..").locator("..");
    await findRow().getByRole("button", { name: "Edit" }).waitFor();
    await findRow().getByRole("button", { name: "Edit" }).click();
    await page.getByLabel("Publish on homepage").check();
    const editResult = page.waitForResponse(r => /\/api\/admin-app\/banners\/[^/]+$/.test(new URL(r.url()).pathname) && r.request().method() === "PATCH");
    await page.getByRole("button", { name: "Save banner" }).click();
    assert.equal((await editResult).status(), 200);
    let rows = await api(ctx, "/api/admin-app/banners");
    assert.equal(rows.find(x => x.title === bannerTitle)?.published, true);
    page.once("dialog", d => void d.accept());
    const archiveResult = page.waitForResponse(r => /\/api\/admin-app\/banners\/[^/]+$/.test(new URL(r.url()).pathname) && r.request().method() === "PATCH");
    await findRow().getByRole("button", { name: "Archive" }).click();
    assert.equal((await archiveResult).status(), 200);
    rows = await api(ctx, "/api/admin-app/banners");
    assert.equal(rows.find(x => x.title === bannerTitle)?.archived, true);
    assert.equal(rows.find(x => x.title === bannerTitle)?.published, false);
    page.once("dialog", d => void d.accept());
    const restoreResult = page.waitForResponse(r => /\/api\/admin-app\/banners\/[^/]+$/.test(new URL(r.url()).pathname) && r.request().method() === "PATCH");
    await findRow().getByRole("button", { name: "Restore" }).click();
    assert.equal((await restoreResult).status(), 200);
    rows = await api(ctx, "/api/admin-app/banners");
    assert.equal(rows.find(x => x.title === bannerTitle)?.archived, false);
    assert.equal(rows.find(x => x.title === bannerTitle)?.published, false, "Restored banner must remain Draft");
  });


  await verify("homepage-banner-atomic-reordering-and-stale-conflict", async () => {
    const titles = ["QA Sort First " + suffix, "QA Sort Second " + suffix];
    for (let index = 0; index < titles.length; index++) {
      await api(ctx, "/api/admin-app/banners", "POST", {
        title: titles[index], imageUrl: img1, mobileImageUrl: "",
        ctaText: "Shop now", ctaHref: "/shop", description: "QA banner sort",
        sortOrder: 10 + index * 10, categorySlug: null, published: true, archived: false,
      });
    }
    const initial = (await api(ctx, "/api/admin-app/banners")).filter(x => !x.archived);
    assert.ok(initial.findIndex(x => x.title === titles[0]) < initial.findIndex(x => x.title === titles[1]));
    const staleItems = initial.map(x => ({ id: x.id, updatedAt: x.updatedAt }));
    await page.goto(new URL("/admin/homepage", base).href);
    const sortedRow = page.getByText(titles[1], { exact: true }).last().locator("..").locator("..");
    const request = page.waitForResponse(r => new URL(r.url()).pathname === "/api/admin-app/banners/reorder" &&
      r.request().method() === "POST");
    await sortedRow.getByRole("button", { name: "Move banner " + titles[1] + " up" }).click();
    const moved = await request;
    assert.equal(moved.status(), 200, "Owner reorder must persist transactionally");
    const ordered = (await api(ctx, "/api/admin-app/banners")).filter(x => !x.archived);
    assert.ok(ordered.findIndex(x => x.title === titles[1]) < ordered.findIndex(x => x.title === titles[0]));
    assert.deepEqual(ordered.map(x => x.sortOrder), ordered.map((_,i) => i), "Ranks must be dense and unique");
    const stale = await ctx.request.post(new URL("/api/admin-app/banners/reorder", base).href, {
      data: { items: staleItems },
    });
    assert.equal(stale.status(), 409);
    const duplicate = await ctx.request.post(new URL("/api/admin-app/banners/reorder", base).href, {
      data: { items: [staleItems[0], staleItems[0]] },
    });
    assert.equal(duplicate.status(), 400);
    const guest = await browser.newContext();
    try {
      const forbidden = await guest.request.post(new URL("/api/admin-app/banners/reorder", base).href, {
        data: { items: staleItems },
      });
      assert.equal(forbidden.status(), 401);
    } finally { await guest.close(); }
    const upload = page.locator("form").first();
    await upload.getByRole("button", { name: "Upload banner desktop image" }).waitFor();
    await upload.locator('input[type="file"]').first().setInputFiles({
      name: "qa-banner.png", mimeType: "image/png", buffer: Buffer.from([137,80,78,71,13,10,26,10]),
    });
    await upload.getByText("Cloudinary upload is not configured yet.").waitFor();
  });

  await verify("publish-blocks-invalid-stored-required-attributes-in-single-and-bulk", async () => {
    const original = await api(ctx, "/api/admin-app/products/manage", "POST", {
      name: "QA Publish Required " + suffix, sku: "QA-PUBLISH-REQUIRED-" + suffix.toUpperCase(),
      price: 249, categorySlug, brandSlug, status: "DRAFT",
      attributes: { "storage-gb": 32, "case-color": "Black" },
    });
    const categories = await api(ctx, "/api/admin-app/catalog/categories?archived=true");
    const category = categories.find(x => x.slug === categorySlug);
    assert.ok(category, "Owner QA category must exist");
    await api(ctx, "/api/admin-app/catalog/attributes", "POST", {
      categoryId: category.id, name: "Warranty Months", type: "NUMBER", required: true,
    });
    const url = new URL("/api/admin-app/products/" + original.id, base).href;
    const invalidSingle = await ctx.request.patch(url, { data: { status: "ACTIVE" } });
    assert.equal(invalidSingle.status(), 400, "Existing product publish validation must give actionable HTTP 400");
    const singleFailure = await invalidSingle.json();
    assert.match(singleFailure.error, /Warranty Months is required/);
    assert.equal(singleFailure.ok, false);
    const before = (await api(ctx, "/api/admin-app/products")).find(x => x.id === original.id);
    assert.equal(before.status, "DRAFT");
    const invalidBulk = await ctx.request.post(new URL("/api/admin-app/products/bulk", base).href, {
      data: { action: "PUBLISH", products: [{ id: original.id, updatedAt: before.updatedAt }] },
    });
    assert.equal(invalidBulk.status(), 400, "Bulk publish validation must give actionable HTTP 400");
    const bulkFailure = await invalidBulk.json();
    assert.match(bulkFailure.error, /Warranty Months is required/);
    assert.equal(bulkFailure.ok, false);
    assert.equal((await api(ctx, "/api/admin-app/products")).find(x => x.id === original.id).status, "DRAFT");
    await api(ctx, "/api/admin-app/products/" + original.id, "PATCH", {
      attributes: { "storage-gb": 32, "case-color": "Black", "warranty-months": 24 },
    });
    const valid = await api(ctx, "/api/admin-app/products/" + original.id, "PATCH", { status: "ACTIVE" });
    assert.equal(valid.status, "ACTIVE");
    await api(ctx, "/api/admin-app/products/" + original.id, "PATCH", { status: "DRAFT" });
  });

  await verify("homepage-cms-mocked-media-upload-success-and-untrusted-response", async () => {
    await page.goto(new URL("/admin/homepage", base).href);
    const form = page.locator("form").first();
    const preview = page.getByRole("region", { name: "Unsaved homepage banner preview" });
    const before = await api(ctx, "/api/admin-app/banners");
    const validUrl = "https://res.cloudinary.com/nexora-qa-only/image/upload/qa-banner.png";
    let requests = 0;
    await page.route("**/api/admin-app/media/sign", route => route.fulfill({
      status: 200, contentType: "application/json",
      body: JSON.stringify({ ok: true, data: {
        cloudName: "nexora-qa-only", apiKey: "qa-only", timestamp: 123456,
        folder: "nexora/products/images", signature: "fake-signature", resourceType: "image",
      } }),
    }));
    await page.route("https://api.cloudinary.com/**", route => {
      if (route.request().method() === "OPTIONS") return route.fulfill({
        status: 204, headers: { "access-control-allow-origin": "*", "access-control-allow-methods": "POST, OPTIONS", "access-control-allow-headers": "*" },
      });
      requests++;
      return route.fulfill({
        status: 200, contentType: "application/json",
        headers: { "access-control-allow-origin": "*" },
        body: JSON.stringify({ secure_url: requests === 1 ? validUrl : "https://untrusted.example/banner.png" }),
      });
    });
    await page.route("https://res.cloudinary.com/**", route => route.abort());
    const file = { name: "qa-banner.png", mimeType: "image/png", buffer: Buffer.from([137,80,78,71,13,10,26,10]) };
    try {
      await form.locator('input[type="file"]').first().setInputFiles(file);
      await page.waitForFunction(url => document.querySelector('input[aria-label="Desktop image URL"]')?.value === url, validUrl);
      await preview.getByRole("img", { name: "Banner image unavailable" }).waitFor();
      await form.locator('input[type="file"]').nth(1).setInputFiles(file);
      await form.getByRole("alert").getByText("Upload response returned an unsupported media URL.").waitFor();
      assert.equal(await form.getByLabel("Mobile image URL").inputValue(), "");
      assert.equal(requests, 2, "Both uploads must be locally intercepted; no provider traffic");
      const after = await api(ctx, "/api/admin-app/banners");
      assert.equal(after.length, before.length, "Mocked media upload and unsaved preview must not persist a banner");
    } finally {
      await page.unroute("**/api/admin-app/media/sign");
      await page.unroute("https://api.cloudinary.com/**");
      await page.unroute("https://res.cloudinary.com/**");
    }
  });


  await verify("single-product-create-and-edit-audit-failure-roll-back-media-and-product", async () => {
    const dbClient = new pg.Client({ connectionString: process.env.DATABASE_URL });
    await dbClient.connect();
    let triggerCreated = false;
    const candidateSku = "QA-ROLLBACK-" + suffix.toUpperCase();
    try {
      await dbClient.query("CREATE FUNCTION qa_reject_single_product_audit() RETURNS trigger AS $qaudit$ BEGIN RAISE EXCEPTION 'QA single product audit rejection'; END; $qaudit$ LANGUAGE plpgsql");
      await dbClient.query('CREATE TRIGGER qa_reject_single_product_audit_trg BEFORE INSERT ON "AdminActivityLog" FOR EACH ROW WHEN (NEW."action" IN (\'PRODUCT_CREATE\',\'PRODUCT_UPDATE\')) EXECUTE FUNCTION qa_reject_single_product_audit()');
      triggerCreated = true;
      const createFailure = await ctx.request.post(new URL("/api/admin-app/products/manage", base).href, {
        data: { name: "QA Failed Create " + suffix, sku: candidateSku, price: 699,
          posterUrl: img1, status: "DRAFT" },
      });
      assert.equal(createFailure.status(), 500, "Audit insert failure must return safe server error");
      const failureBody = await createFailure.json();
      assert.equal(failureBody.error, "Unexpected admin server error.", "Internal SQL errors must not leak");
      const created = await dbClient.query('SELECT "id" FROM "Product" WHERE "sku" = $1', [candidateSku]);
      assert.equal(created.rows.length, 0, "Failed audit must roll back product and its media");

      const original = await product(ctx);
      const auditBefore = await dbClient.query('SELECT count(*)::int AS total FROM "AdminActivityLog" WHERE "entityId" = $1', [original.id]);
      const updateFailure = await ctx.request.patch(new URL("/api/admin-app/products/" + original.id, base).href, {
        data: { description: "QA this update must not persist " + suffix, posterUrl: img2 },
      });
      assert.equal(updateFailure.status(), 500, "Failed audit must fail the entire Product edit");
      assert.equal((await updateFailure.json()).error, "Unexpected admin server error.");
      const after = await product(ctx);
      assert.equal(after.description, original.description, "Product description must roll back");
      assert.equal(after.posterUrl, original.posterUrl, "Poster media change must roll back");
      assert.equal(after.updatedAt, original.updatedAt, "Product revision must remain unchanged");
      const auditAfter = await dbClient.query('SELECT count(*)::int AS total FROM "AdminActivityLog" WHERE "entityId" = $1', [original.id]);
      assert.equal(auditAfter.rows[0].total, auditBefore.rows[0].total, "Failed audit must leave no activity");
    } finally {
      if (triggerCreated) await dbClient.query('DROP TRIGGER IF EXISTS qa_reject_single_product_audit_trg ON "AdminActivityLog"');
      await dbClient.query("DROP FUNCTION IF EXISTS qa_reject_single_product_audit()");
      await dbClient.end();
    }
  });

  await verify("cms-media-cancel-in-flight-xhr-and-safe-retry", async () => {
    await page.goto(new URL("/admin/homepage", base).href);
    const form = page.locator("form").first();
    const before = await api(ctx, "/api/admin-app/banners");
    const uploaded = "https://res.cloudinary.com/nexora-qa-only/image/upload/qa-retry.png";
    let requests = 0;
    await page.route("**/api/admin-app/media/sign", route => route.fulfill({
      status: 200, contentType: "application/json",
      body: JSON.stringify({ ok: true, data: {
        cloudName: "nexora-qa-only", apiKey: "qa", timestamp: 123456,
        folder: "nexora/products/images", signature: "mock", resourceType: "image",
      } }),
    }));
    await page.route("https://api.cloudinary.com/**", async route => {
      if (route.request().method() === "OPTIONS") {
        try { await route.fulfill({ status: 204, headers: {
          "access-control-allow-origin": "*", "access-control-allow-methods": "POST, OPTIONS",
          "access-control-allow-headers": "*",
        } }); } catch {}
        return;
      }
      requests++;
      if (requests === 1) await new Promise(resolve => setTimeout(resolve, 3000));
      try { await route.fulfill({ status: 200, contentType: "application/json",
        headers: { "access-control-allow-origin": "*" },
        body: JSON.stringify({ secure_url: uploaded }),
      }); } catch {} // First aborted request may no longer have a consumer.
    });
    await page.route("https://res.cloudinary.com/**", route => route.abort());
    const file = { name: "qa-retry.png", mimeType: "image/png", buffer: Buffer.from([137,80,78,71,13,10,26,10]) };
    try {
      const started = page.waitForRequest(request => request.url().startsWith("https://api.cloudinary.com/") && request.method() === "POST");
      await form.locator('input[type="file"]').first().setInputFiles(file);
      await started;
      await form.getByRole("button", { name: "Cancel upload" }).click();
      await form.getByRole("alert").getByText("Upload was cancelled.").waitFor();
      assert.equal(await form.getByLabel("Desktop image URL").inputValue(), "", "Aborted upload cannot set media URL");
      await form.locator('input[type="file"]').first().setInputFiles(file);
      await page.waitForFunction(url => document.querySelector('input[aria-label="Desktop image URL"]')?.value === url, uploaded);
      assert.equal(requests, 2, "Cancelled upload is retried exactly once");
      assert.equal((await api(ctx, "/api/admin-app/banners")).length, before.length,
        "Neither cancelled nor retried unsaved media changes persist to DB");
    } finally {
      await page.unroute("**/api/admin-app/media/sign");
      await page.unroute("https://api.cloudinary.com/**");
      await page.unroute("https://res.cloudinary.com/**");
    }
  });

  await ctx.close();
} finally {
  await browser.close();
  writeFileSync(join(evidence, "results.json"), JSON.stringify({ localOnly: true, qaDatabase: "nexora_qa", results }, null, 2));
}
console.log("ADMIN BROWSER RESULTS", results.filter(v => v.result === "PASS").length, "PASS /", results.filter(v => v.result === "FAIL").length, "FAIL");
