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
  // Never allow this QA suite to reach a live email provider.
  process.env.RESEND_API_KEY || process.env.ORDER_EMAIL_FROM ||
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
    const isolatedSku = "QA-ROLLBACK-EDIT-" + suffix.toUpperCase();
    let isolatedId = null;
    try {
      // Dedicated draft prevents previous publish/category/browser tests from
      // turning the audit-rollback assertion into a 400 publish-validation test.
      const isolated = await api(ctx, "/api/admin-app/products/manage", "POST", {
        name: "QA Atomic Edit " + suffix, sku: isolatedSku, price: 699,
        posterUrl: img1, status: "DRAFT",
      });
      isolatedId = isolated.id;
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

      const original = (await api(ctx, "/api/admin-app/products")).find(v => v.id === isolatedId);
      assert.ok(original && original.status === "DRAFT", "Isolated rollback fixture must remain a draft");
      const auditBefore = await dbClient.query('SELECT count(*)::int AS total FROM "AdminActivityLog" WHERE "entityId" = $1', [original.id]);
      const updateFailure = await ctx.request.patch(new URL("/api/admin-app/products/" + original.id, base).href, {
        data: { description: "QA this update must not persist " + suffix, posterUrl: img2 },
      });
      assert.equal(updateFailure.status(), 500, "Failed audit must fail the entire Product edit");
      assert.equal((await updateFailure.json()).error, "Unexpected admin server error.");
      const after = (await api(ctx, "/api/admin-app/products")).find(v => v.id === isolatedId);
      assert.ok(after, "Rollback fixture must remain after failed audit");
      assert.equal(after.description, original.description, "Product description must roll back");
      assert.equal(after.posterUrl, original.posterUrl, "Poster media change must roll back");
      assert.equal(after.updatedAt, original.updatedAt, "Product revision must remain unchanged");
      const auditAfter = await dbClient.query('SELECT count(*)::int AS total FROM "AdminActivityLog" WHERE "entityId" = $1', [original.id]);
      assert.equal(auditAfter.rows[0].total, auditBefore.rows[0].total, "Failed audit must leave no activity");
    } finally {
      if (triggerCreated) await dbClient.query('DROP TRIGGER IF EXISTS qa_reject_single_product_audit_trg ON "AdminActivityLog"');
      await dbClient.query("DROP FUNCTION IF EXISTS qa_reject_single_product_audit()");
      if (isolatedId) {
        await dbClient.query('DELETE FROM "AdminActivityLog" WHERE "entityId"=$1', [isolatedId]);
        await dbClient.query('DELETE FROM "Product" WHERE "id"=$1', [isolatedId]);
      }
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


  await verify("homepage-banner-validation-returns-actionable-400-without-write", async () => {
    const valid = {
      title: "QA Valid Banner " + suffix, description: "QA owner-safe",
      imageUrl: img1, mobileImageUrl: "", ctaText: "Shop now",
      ctaHref: "/shop", categorySlug: "", sortOrder: 10, published: false,
    };
    const previous = await api(ctx, "/api/admin-app/banners");
    const invalidUrl = await ctx.request.post(new URL("/api/admin-app/banners", base).href, {
      data: { ...valid, imageUrl: "http://untrusted.example/test.png" },
    });
    assert.equal(invalidUrl.status(), 400);
    assert.match((await invalidUrl.json()).error, /approved HTTPS/);
    const invalidRoute = await ctx.request.post(new URL("/api/admin-app/banners", base).href, {
      data: { ...valid, ctaHref: "//untrusted.example" },
    });
    assert.equal(invalidRoute.status(), 400);
    assert.match((await invalidRoute.json()).error, /internal CTA/);
    const invalidJson = await ctx.request.post(new URL("/api/admin-app/banners", base).href, {
      headers: { "content-type": "application/json" }, data: '{"title":',
    });
    assert.equal(invalidJson.status(), 400);
    assert.match((await invalidJson.json()).error, /Invalid homepage banner/);
    assert.equal((await api(ctx, "/api/admin-app/banners")).length, previous.length);

    const row = await api(ctx, "/api/admin-app/banners", "POST", valid);
    const patchUrl = new URL("/api/admin-app/banners/" + row.id, base).href;
    const badPatch = await ctx.request.patch(patchUrl, { data: { ...valid, sortOrder: -4, title: "SHOULD NOT SAVE" } });
    assert.equal(badPatch.status(), 400);
    assert.match((await badPatch.json()).error, /Display order/);
    const fetched = (await api(ctx, "/api/admin-app/banners")).find(x => x.id === row.id);
    assert.equal(fetched.title, valid.title, "Bad PATCH cannot alter persisted Banner");
    assert.equal(fetched.sortOrder, 10);
  });


  await verify("stock-adjustment-owner-api-atomic-audit-rollback-and-validation", async () => {
    const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();
    const current = await product(ctx);
    const warehouseId = "qa-adjust-wh-" + suffix;
    const inventoryId = "qa-adjust-inv-" + suffix;
    const warehouseCode = "QA-ADJUST-" + suffix.toUpperCase();
    let triggered = false;
    try {
      await client.query(
        'INSERT INTO "Warehouse" ("id","code","name","city","state","active","createdAt","updatedAt") VALUES ($1,$2,$3,$4,$5,true,now(),now())',
        [warehouseId, warehouseCode, "QA Stock Audit", "QA", "QA"],
      );
      await client.query(
        'INSERT INTO "InventoryItem" ("id","productId","warehouseId","onHand","reserved","reorderLevel","updatedAt") VALUES ($1,$2,$3,20,5,5,now())',
        [inventoryId, current.id, warehouseId],
      );
      const adjustment = { inventoryId, delta: 3, note: "QA verified adjustment" };
      const url = new URL("/api/admin-app/inventory/adjust", base).href;
      const anonymous = await browser.newContext();
      try {
        assert.equal((await anonymous.request.post(url, { data: adjustment })).status(), 401);
      } finally { await anonymous.close(); }
      for (const body of [
        { ...adjustment, delta: "3" }, { ...adjustment, delta: 0 },
        { ...adjustment, delta: 1.2 }, { ...adjustment, note: "x" },
        { ...adjustment, delta: -16 },
      ]) {
        const failure = await ctx.request.post(url, { data: body });
        assert.equal(failure.status(), 400, "Invalid stock adjustment must be client error");
      }
      await client.query("CREATE FUNCTION qa_reject_stock_audit() RETURNS trigger AS $qa_adjust$ BEGIN RAISE EXCEPTION 'QA stock audit denied'; END; $qa_adjust$ LANGUAGE plpgsql");
      await client.query('CREATE TRIGGER qa_reject_stock_audit_trg BEFORE INSERT ON "AdminActivityLog" FOR EACH ROW WHEN (NEW."action" = \'INVENTORY_ADJUSTMENT\') EXECUTE FUNCTION qa_reject_stock_audit()');
      triggered = true;
      const auditFailure = await ctx.request.post(url, { data: adjustment });
      assert.equal(auditFailure.status(), 500);
      assert.equal((await auditFailure.json()).error, "Unexpected admin server error.");
      const notChanged = await client.query('SELECT "onHand","reserved" FROM "InventoryItem" WHERE "id" = $1', [inventoryId]);
      assert.equal(notChanged.rows[0].onHand, 20);
      assert.equal(notChanged.rows[0].reserved, 5);
      const movements = await client.query('SELECT count(*)::int AS total FROM "InventoryMovement" WHERE "reference" = $1', ["ADMIN:" + inventoryId]);
      assert.equal(movements.rows[0].total, 0, "Movement must roll back when audit insert fails");
      await client.query('DROP TRIGGER qa_reject_stock_audit_trg ON "AdminActivityLog"');
      await client.query("DROP FUNCTION qa_reject_stock_audit()");
      triggered = false;
      const valid = await api(ctx, "/api/admin-app/inventory/adjust", "POST", adjustment);
      assert.equal(valid.onHand, 23, "Valid adjustment must update stock after recovery");
      const movementAfter = await client.query('SELECT count(*)::int AS total FROM "InventoryMovement" WHERE "reference" = $1', ["ADMIN:" + inventoryId]);
      assert.equal(movementAfter.rows[0].total, 1);
      const auditAfter = await client.query('SELECT count(*)::int AS total FROM "AdminActivityLog" WHERE "action" = $1 AND "entityId" = $2', ["INVENTORY_ADJUSTMENT", inventoryId]);
      assert.equal(auditAfter.rows[0].total, 1);
      const requests = await Promise.all([
        ctx.request.post(url, { data: { ...adjustment, delta: 2 } }),
        ctx.request.post(url, { data: { ...adjustment, delta: 4 } }),
      ]);
      const codes = requests.map(x => x.status());
      assert.ok(codes.every(x => x === 200 || x === 409), "Concurrent writes must succeed or return conflict, not 500");
      const expected = 23 + (codes[0] === 200 ? 2 : 0) + (codes[1] === 200 ? 4 : 0);
      const final = await client.query('SELECT "onHand" FROM "InventoryItem" WHERE "id" = $1', [inventoryId]);
      assert.equal(final.rows[0].onHand, expected, "No concurrent stock update may be lost");
      const finalMoves = await client.query('SELECT count(*)::int AS total FROM "InventoryMovement" WHERE "reference" = $1', ["ADMIN:" + inventoryId]);
      const finalAudits = await client.query('SELECT count(*)::int AS total FROM "AdminActivityLog" WHERE "action" = $1 AND "entityId" = $2', ["INVENTORY_ADJUSTMENT", inventoryId]);
      assert.equal(finalMoves.rows[0].total, 1 + codes.filter(x => x === 200).length);
      assert.equal(finalAudits.rows[0].total, finalMoves.rows[0].total);
    } finally {
      if (triggered) await client.query('DROP TRIGGER IF EXISTS qa_reject_stock_audit_trg ON "AdminActivityLog"');
      await client.query("DROP FUNCTION IF EXISTS qa_reject_stock_audit()");
      await client.query('DELETE FROM "InventoryMovement" WHERE "reference" = $1', ["ADMIN:" + inventoryId]);
      await client.query('DELETE FROM "AdminActivityLog" WHERE "entityId" = $1 AND "action" = $2', [inventoryId, "INVENTORY_ADJUSTMENT"]);
      await client.query('DELETE FROM "InventoryItem" WHERE "id" = $1', [inventoryId]);
      await client.query('DELETE FROM "Warehouse" WHERE "id" = $1', [warehouseId]);
      await client.end();
    }
  });


  await verify("warehouse-transfer-atomic-stock-history-audit-and-concurrent-reservations", async () => {
    const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();
    const item = await product(ctx);
    const from = "qa-xfer-from-" + suffix, to = "qa-xfer-to-" + suffix;
    const sourceId = "qa-xfer-src-" + suffix, destId = "qa-xfer-dst-" + suffix;
    const url = new URL("/api/admin-app/warehouses/transfer", base).href;
    const send = (quantity) => ({ fromWarehouseId: from, toWarehouseId: to, productId: item.id,
      quantity, note: "QA verified transfer" });
    let triggerActive = false;
    try {
      for (const [id, code] of [[from, "QA-XFER-FROM-" + suffix.toUpperCase()], [to, "QA-XFER-TO-" + suffix.toUpperCase()]]) {
        await client.query('INSERT INTO "Warehouse" ("id","code","name","city","state","active","createdAt","updatedAt") VALUES ($1,$2,$3,$4,$5,true,now(),now())',
          [id, code, "QA Transfer", "QA", "QA"]);
      }
      for (const [id, warehouse, onHand, reserved] of [
        [sourceId, from, 12, 3], [destId, to, 5, 1],
      ]) {
        await client.query('INSERT INTO "InventoryItem" ("id","productId","warehouseId","onHand","reserved","reorderLevel","updatedAt") VALUES ($1,$2,$3,$4,$5,5,now())',
          [id, item.id, warehouse, onHand, reserved]);
      }
      const guest = await browser.newContext();
      try {
        assert.equal((await guest.request.post(url, { data: send(3) })).status(), 401);
      } finally { await guest.close(); }
      for (const invalid of [
        send("3"), send(0), send(1.2), send(100001), send(-1),
        { ...send(2), toWarehouseId: from },
        { ...send(2), fromWarehouseId: "missing" },
      ]) {
        const response = await ctx.request.post(url, { data: invalid });
        assert.ok([400, 409].includes(response.status()), "Bad input or unavailable source must fail safely");
      }
      const tooMuch = await ctx.request.post(url, { data: send(10) });
      assert.equal(tooMuch.status(), 409, "Reserved source stock is unavailable for transfer");

      await client.query("CREATE FUNCTION qa_reject_transfer_audit() RETURNS trigger AS $qtransfer$ BEGIN RAISE EXCEPTION 'QA transfer audit rejected'; END; $qtransfer$ LANGUAGE plpgsql");
      await client.query('CREATE TRIGGER qa_reject_transfer_audit_trg BEFORE INSERT ON "AdminActivityLog" FOR EACH ROW WHEN (NEW."action" = \'WAREHOUSE_TRANSFER\') EXECUTE FUNCTION qa_reject_transfer_audit()');
      triggerActive = true;
      const failed = await ctx.request.post(url, { data: send(4) });
      assert.equal(failed.status(), 500, "Audit failure must roll back complete warehouse transfer");
      assert.equal((await failed.json()).error, "Unexpected admin server error.", "Internal SQL error must stay private");
      const stockAfterFail = await client.query('SELECT "warehouseId","onHand","reserved" FROM "InventoryItem" WHERE "id" IN ($1,$2)', [sourceId, destId]);
      assert.equal(stockAfterFail.rows.find(r => r.warehouseId === from).onHand, 12);
      assert.equal(stockAfterFail.rows.find(r => r.warehouseId === to).onHand, 5);
      assert.equal((await client.query('SELECT count(*)::int AS n FROM "WarehouseTransfer" WHERE "fromWarehouseId" = $1', [from])).rows[0].n, 0);
      assert.equal((await client.query('SELECT count(*)::int AS n FROM "InventoryMovement" WHERE "warehouseId" IN ($1,$2) AND "type" = $3', [from, to, "TRANSFER"])).rows[0].n, 0);
      await client.query('DROP TRIGGER qa_reject_transfer_audit_trg ON "AdminActivityLog"');
      await client.query("DROP FUNCTION qa_reject_transfer_audit()");
      triggerActive = false;

      const accepted = await api(ctx, "/api/admin-app/warehouses/transfer", "POST", send(4));
      assert.ok(accepted.id, "Completed transfer ID must be returned");
      const header = await client.query('SELECT "status","createdByUserId" FROM "WarehouseTransfer" WHERE "id" = $1', [accepted.id]);
      assert.equal(header.rows[0].status, "COMPLETED", "Status must be a bound text value, not a quoted SQL identifier");
      assert.ok(header.rows[0].createdByUserId);
      assert.equal((await client.query('SELECT "quantity" FROM "WarehouseTransferItem" WHERE "transferId" = $1', [accepted.id])).rows[0].quantity, 4);
      assert.equal((await client.query('SELECT count(*)::int AS n FROM "InventoryMovement" WHERE "reference" = $1', [accepted.id])).rows[0].n, 2);
      assert.equal((await client.query('SELECT count(*)::int AS n FROM "AdminActivityLog" WHERE "action" = $1 AND "entityId" = $2', ["WAREHOUSE_TRANSFER", accepted.id])).rows[0].n, 1);

      const concurrent = await Promise.all([ctx.request.post(url, { data: send(5) }), ctx.request.post(url, { data: send(5) })]);
      const statuses = concurrent.map(x => x.status());
      assert.ok(statuses.every(x => x === 201 || x === 409), "Concurrent transfers return success or stale-stock conflict");
      assert.equal(statuses.filter(x => x === 201).length, 1, "Only one transfer can consume remaining unreserved stock");
      const finalStock = await client.query('SELECT "warehouseId","onHand","reserved" FROM "InventoryItem" WHERE "id" IN ($1,$2)', [sourceId, destId]);
      assert.equal(finalStock.rows.find(r => r.warehouseId === from).onHand, 3);
      assert.equal(finalStock.rows.find(r => r.warehouseId === to).onHand, 14);
      const transferRows = await client.query('SELECT "id" FROM "WarehouseTransfer" WHERE "fromWarehouseId" = $1 AND "toWarehouseId" = $2', [from,to]);
      assert.equal(transferRows.rows.length, 2);
      for (const row of transferRows.rows) {
        assert.equal((await client.query('SELECT count(*)::int AS n FROM "AdminActivityLog" WHERE "entityId" = $1 AND "action" = $2', [row.id, "WAREHOUSE_TRANSFER"])).rows[0].n, 1);
        assert.equal((await client.query('SELECT count(*)::int AS n FROM "InventoryMovement" WHERE "reference" = $1', [row.id])).rows[0].n, 2);
      }
    } finally {
      if (triggerActive) await client.query('DROP TRIGGER IF EXISTS qa_reject_transfer_audit_trg ON "AdminActivityLog"');
      await client.query("DROP FUNCTION IF EXISTS qa_reject_transfer_audit()");
      const all = await client.query('SELECT "id" FROM "WarehouseTransfer" WHERE "fromWarehouseId" = $1 OR "toWarehouseId" = $1', [from]);
      for (const row of all.rows) {
        await client.query('DELETE FROM "InventoryMovement" WHERE "reference" = $1', [row.id]);
        await client.query('DELETE FROM "AdminActivityLog" WHERE "action" = $1 AND "entityId" = $2', ["WAREHOUSE_TRANSFER", row.id]);
      }
      await client.query('DELETE FROM "WarehouseTransfer" WHERE "fromWarehouseId" = $1 OR "toWarehouseId" = $1', [from]);
      await client.query('DELETE FROM "InventoryItem" WHERE "id" IN ($1,$2)', [sourceId,destId]);
      await client.query('DELETE FROM "Warehouse" WHERE "id" IN ($1,$2)', [from,to]);
      await client.end();
    }
  });


  await verify("order-status-audit-failure-rolls-back-reservation-and-no-repeat-side-effects", async () => {
    const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();
    const qaProduct = await product(ctx);
    const customerId = "qa-order-user-" + suffix;
    const warehouseId = "qa-order-warehouse-" + suffix;
    const inventoryId = "qa-order-stock-" + suffix;
    const orderId = "qa-status-order-" + suffix;
    const orderNumber = "QA-STATUS-" + suffix.toUpperCase();
    const url = new URL("/api/admin-app/orders/" + orderId + "/status", base).href;
    let triggerOn = false;
    try {
      await client.query(
        'INSERT INTO "User" ("id","email","name","passwordHash","role","status","createdAt","updatedAt") VALUES ($1,$2,$3,$4,$5,$6,now(),now())',
        [customerId, "qa-order-" + suffix + "@example.invalid", "QA Customer", "qa-unusable-hash", "CUSTOMER", "ACTIVE"],
      );
      await client.query(
        'INSERT INTO "Warehouse" ("id","code","name","city","state","active","createdAt","updatedAt") VALUES ($1,$2,$3,$4,$5,true,now(),now())',
        [warehouseId, orderNumber, "QA Order Warehouse", "QA", "QA"],
      );
      await client.query(
        'INSERT INTO "InventoryItem" ("id","productId","warehouseId","onHand","reserved","reorderLevel","updatedAt") VALUES ($1,$2,$3,15,3,5,now())',
        [inventoryId, qaProduct.id, warehouseId],
      );
      await client.query(
        'INSERT INTO "Order" ("id","orderNumber","userId","status","paymentStatus","currency","subtotalMinor","totalMinor","paymentMethod","shippingAddress","createdAt","updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,now(),now())',
        [orderId, orderNumber, customerId, "PENDING", "PENDING", "INR", 200, 200, "cod", JSON.stringify({ city: "QA" })],
      );
      await client.query(
        'INSERT INTO "OrderItem" ("id","orderId","productId","productName","sku","quantity","unitPriceMinor","totalMinor") VALUES ($1,$2,$3,$4,$5,3,100,300)',
        ["qa-status-item-" + suffix, orderId, qaProduct.id, qaProduct.name, qaProduct.sku],
      );
      await client.query(
        'INSERT INTO "InventoryMovement" ("id","warehouseId","productId","type","quantity","reference","note","createdAt") VALUES ($1,$2,$3,$4,3,$5,$6,now())',
        ["qa-status-reserve-" + suffix, warehouseId, qaProduct.id, "RESERVE", orderNumber, "QA reserved stock"],
      );
      const guest = await browser.newContext();
      try {
        assert.equal((await guest.request.patch(url, { data: { status: "CANCELLED" } })).status(), 401);
      } finally { await guest.close(); }
      const invalid = await ctx.request.patch(url, { data: { status: "COMPLETE" } });
      assert.equal(invalid.status(), 400);

      await client.query("CREATE FUNCTION qa_reject_order_status_audit() RETURNS trigger AS $q_order$ BEGIN RAISE EXCEPTION 'QA order audit rejected'; END; $q_order$ LANGUAGE plpgsql");
      await client.query('CREATE TRIGGER qa_reject_order_status_audit_trg BEFORE INSERT ON "AdminActivityLog" FOR EACH ROW WHEN (NEW."action" = \'ORDER_STATUS_UPDATE\') EXECUTE FUNCTION qa_reject_order_status_audit()');
      triggerOn = true;
      const failed = await ctx.request.patch(url, { data: { status: "CANCELLED" } });
      assert.equal(failed.status(), 500, "Rejected audit must roll back the status and reservation");
      assert.equal((await failed.json()).error, "Unexpected admin server error.");
      const unchangedOrder = await client.query('SELECT "status" FROM "Order" WHERE "id" = $1', [orderId]);
      assert.equal(unchangedOrder.rows[0].status, "PENDING");
      const unchangedStock = await client.query('SELECT "onHand","reserved" FROM "InventoryItem" WHERE "id" = $1', [inventoryId]);
      assert.equal(unchangedStock.rows[0].onHand, 15);
      assert.equal(unchangedStock.rows[0].reserved, 3);
      assert.equal((await client.query('SELECT count(*)::int AS n FROM "InventoryMovement" WHERE "reference" = $1 AND "type" = $2', [orderNumber, "RELEASE"])).rows[0].n, 0);
      assert.equal((await client.query('SELECT count(*)::int AS n FROM "AdminNotification" WHERE "entityId" = $1', [orderId])).rows[0].n, 0, "No post-commit notification on rejected audit");

      await client.query('DROP TRIGGER qa_reject_order_status_audit_trg ON "AdminActivityLog"');
      await client.query("DROP FUNCTION qa_reject_order_status_audit()");
      triggerOn = false;
      const completed = await api(ctx, "/api/admin-app/orders/" + orderId + "/status", "PATCH", { status: "CANCELLED" });
      assert.equal(completed.status, "CANCELLED");
      const finalStock = await client.query('SELECT "onHand","reserved" FROM "InventoryItem" WHERE "id" = $1', [inventoryId]);
      assert.equal(finalStock.rows[0].onHand, 15);
      assert.equal(finalStock.rows[0].reserved, 0);
      assert.equal((await client.query('SELECT count(*)::int AS n FROM "InventoryMovement" WHERE "reference" = $1 AND "type" = $2', [orderNumber, "RELEASE"])).rows[0].n, 1);
      assert.equal((await client.query('SELECT count(*)::int AS n FROM "AdminActivityLog" WHERE "entityId" = $1 AND "action" = $2', [orderId, "ORDER_STATUS_UPDATE"])).rows[0].n, 1);
      const again = await api(ctx, "/api/admin-app/orders/" + orderId + "/status", "PATCH", { status: "CANCELLED" });
      assert.equal(again.unchanged, true, "Identical repeat is idempotent and must not create extra audit");
      assert.equal((await client.query('SELECT count(*)::int AS n FROM "AdminActivityLog" WHERE "entityId" = $1 AND "action" = $2', [orderId, "ORDER_STATUS_UPDATE"])).rows[0].n, 1);
      assert.equal((await client.query('SELECT count(*)::int AS n FROM "InventoryMovement" WHERE "reference" = $1 AND "type" = $2', [orderNumber, "RELEASE"])).rows[0].n, 1);
      assert.equal((await ctx.request.patch(url, { data: { status: "PROCESSING" } })).status(), 409, "Terminal cancelled order cannot restart");
    } finally {
      if (triggerOn) await client.query('DROP TRIGGER IF EXISTS qa_reject_order_status_audit_trg ON "AdminActivityLog"');
      await client.query("DROP FUNCTION IF EXISTS qa_reject_order_status_audit()");
      await client.query('DELETE FROM "AdminNotification" WHERE "entityId" = $1', [orderId]);
      await client.query('DELETE FROM "AdminActivityLog" WHERE "entityId" = $1 AND "action" = $2', [orderId, "ORDER_STATUS_UPDATE"]);
      await client.query('DELETE FROM "InventoryMovement" WHERE "reference" = $1', [orderNumber]);
      await client.query('DELETE FROM "OrderItem" WHERE "orderId" = $1', [orderId]);
      await client.query('DELETE FROM "Order" WHERE "id" = $1', [orderId]);
      await client.query('DELETE FROM "InventoryItem" WHERE "id" = $1', [inventoryId]);
      await client.query('DELETE FROM "Warehouse" WHERE "id" = $1', [warehouseId]);
      await client.query('DELETE FROM "User" WHERE "id" = $1', [customerId]);
      await client.end();
    }
  });


  await verify("seller-onboarding-owner-credentials-profile-and-audit-rollback", async () => {
    const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();
    const url = new URL("/api/admin-app/sellers/onboard", base).href;
    const sellerEmail = "qa-seller-" + suffix + "@example.invalid";
    const password = "QaSeller!Secret29-" + suffix;
    const seller = {
      email: sellerEmail, name: "QA Test Seller", storeName: "QA Gift Store",
      password, commissionBps: 0, gstNumber: "",
    };
    let auditTrigger = false;
    try {
      const guest = await browser.newContext();
      try {
        assert.equal((await guest.request.post(url, { data: seller })).status(), 401, "Only Owner can onboard seller");
      } finally { await guest.close(); }
      for (const invalid of [
        { ...seller, password: undefined },
        { ...seller, password: "weak" },
        { ...seller, password: "NexoraSeller@123" },
        { ...seller, commissionBps: "0" },
        { ...seller, commissionBps: -1 },
        { ...seller, commissionBps: 10001 },
        { ...seller, commissionBps: 10.2 },
        { ...seller, email: "not-an-email" },
      ]) {
        const response = await ctx.request.post(url, { data: invalid });
        assert.equal(response.status(), 400, "Bad Seller onboarding input must return 400");
      }
      const malformed = await ctx.request.post(url, {
        headers: { "content-type": "application/json" }, data: '{"email":',
      });
      assert.equal(malformed.status(), 400, "Malformed JSON must not be accepted");
      assert.equal((await client.query('SELECT count(*)::int AS n FROM "User" WHERE "email" = $1', [sellerEmail])).rows[0].n, 0);

      await client.query("CREATE FUNCTION qa_reject_seller_onboard_audit() RETURNS trigger AS $qaseller$ BEGIN RAISE EXCEPTION 'QA seller audit rejected'; END; $qaseller$ LANGUAGE plpgsql");
      await client.query('CREATE TRIGGER qa_reject_seller_onboard_audit_trg BEFORE INSERT ON "AdminActivityLog" FOR EACH ROW WHEN (NEW."action" = \'SELLER_ONBOARD\') EXECUTE FUNCTION qa_reject_seller_onboard_audit()');
      auditTrigger = true;
      const rejected = await ctx.request.post(url, { data: seller });
      assert.equal(rejected.status(), 500, "Seller, Profile and Audit must roll back as one unit");
      assert.equal((await rejected.json()).error, "Unexpected admin server error.", "SQL details must not leak");
      assert.equal((await client.query('SELECT count(*)::int AS n FROM "User" WHERE "email" = $1', [sellerEmail])).rows[0].n, 0, "No orphan User allowed");
      assert.equal((await client.query('SELECT count(*)::int AS n FROM "SellerProfile" s JOIN "User" u ON u."id"=s."userId" WHERE u."email" = $1', [sellerEmail])).rows[0].n, 0);

      await client.query('DROP TRIGGER qa_reject_seller_onboard_audit_trg ON "AdminActivityLog"');
      await client.query("DROP FUNCTION qa_reject_seller_onboard_audit()");
      auditTrigger = false;
      const accepted = await api(ctx, "/api/admin-app/sellers/onboard", "POST", seller);
      assert.ok(accepted.userId && accepted.profileId);
      assert.equal(accepted.email, sellerEmail);
      assert.equal(accepted.password, undefined, "API must never echo Seller password");
      assert.equal(accepted.passwordHash, undefined, "API must not expose Seller hash");
      const user = await client.query('SELECT "id","role","status","passwordHash" FROM "User" WHERE "email" = $1', [sellerEmail]);
      assert.equal(user.rows.length, 1);
      assert.equal(user.rows[0].id, accepted.userId);
      assert.equal(user.rows[0].role, "SELLER");
      assert.equal(user.rows[0].status, "PENDING_VERIFICATION", "Unapproved seller cannot hold an active login session");
      assert.notEqual(user.rows[0].passwordHash, password);
      assert.match(user.rows[0].passwordHash, /^scrypt\$/);
      const profile = await client.query('SELECT "id","userId","commissionBps","verificationStatus","payoutStatus" FROM "SellerProfile" WHERE "id" = $1', [accepted.profileId]);
      assert.equal(profile.rows[0].userId, accepted.userId);
      assert.equal(profile.rows[0].commissionBps, 0, "Explicit zero commission must not become default 1000");
      assert.equal(profile.rows[0].verificationStatus, "PENDING");
      assert.equal(profile.rows[0].payoutStatus, "HOLD");
      assert.equal((await client.query('SELECT count(*)::int AS n FROM "AdminActivityLog" WHERE "entityId" = $1 AND "action" = $2', [accepted.profileId, "SELLER_ONBOARD"])).rows[0].n, 1);
      const duplicate = await ctx.request.post(url, { data: seller });
      assert.equal(duplicate.status(), 409);
      assert.match((await duplicate.json()).error, /already registered/);
      assert.equal((await client.query('SELECT count(*)::int AS n FROM "User" WHERE "email" = $1', [sellerEmail])).rows[0].n, 1);
    } finally {
      if (auditTrigger) await client.query('DROP TRIGGER IF EXISTS qa_reject_seller_onboard_audit_trg ON "AdminActivityLog"');
      await client.query("DROP FUNCTION IF EXISTS qa_reject_seller_onboard_audit()");
      await client.query('DELETE FROM "AdminActivityLog" WHERE "action" = $1 AND "entityId" IN (SELECT s."id" FROM "SellerProfile" s JOIN "User" u ON u."id"=s."userId" WHERE u."email"=$2)', ["SELLER_ONBOARD", sellerEmail]);
      await client.query('DELETE FROM "SellerProfile" WHERE "userId" IN (SELECT "id" FROM "User" WHERE "email"=$1)', [sellerEmail]);
      await client.query('DELETE FROM "User" WHERE "email"=$1', [sellerEmail]);
      await client.end();
    }
  });


  await verify("seller-review-owner-approval-rollback-idempotency-and-suspension", async () => {
    const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();
    const email = "qa-review-" + suffix + "@example.invalid";
    const seller = { name:"QA Review Seller", storeName:"QA Review Store",
      email, password:"QA!SellerReview42-"+suffix, commissionBps:900 };
    const url = new URL("/api/admin-app/sellers", base).href;
    let auditTrigger = false;
    try {
      const created = await api(ctx,"/api/admin-app/sellers/onboard","POST",seller);
      const id = created.profileId;
      const read = () => client.query('SELECT s."verificationStatus",s."payoutStatus",s."commissionBps",u."status"::text AS "userStatus" FROM "SellerProfile" s JOIN "User" u ON u."id"=s."userId" WHERE s."id"=$1',[id]);
      const before = (await read()).rows[0];
      assert.equal(before.verificationStatus,"PENDING");
      assert.equal(before.userStatus,"PENDING_VERIFICATION");
      assert.equal(before.payoutStatus,"HOLD");
      const guest = await browser.newContext();
      try {
        assert.equal((await guest.request.patch(url,{data:{id,verificationStatus:"APPROVED"}})).status(),401);
      } finally { await guest.close(); }
      for (const invalid of [
        {id,verificationStatus:"ALLOWED"},
        {id,verificationStatus:true},
        {id,commissionBps:"100"},
        {id,commissionBps:-1},
        {id,commissionBps:10001},
        {id,commissionBps:4.5},
        {id,payoutStatus:"READY"},
        {id,adminUserId:"fake-owner",verificationStatus:"APPROVED"},
        {id},
      ]) {
        const response = await ctx.request.patch(url,{data:invalid});
        assert.equal(response.status(),400,"Bad Seller review must never persist");
      }
      const absent = await ctx.request.patch(url,{data:{id:"qa-nonexistent",verificationStatus:"APPROVED"}});
      assert.equal(absent.status(),404);
      const malformed = await ctx.request.patch(url,{headers:{"content-type":"application/json"},data:'{"id":'});
      assert.equal(malformed.status(),400);
      assert.deepEqual((await read()).rows[0],before);

      await client.query("CREATE FUNCTION qa_reject_seller_review_audit() RETURNS trigger AS $qr$ BEGIN RAISE EXCEPTION 'QA seller review audit rejected'; END; $qr$ LANGUAGE plpgsql");
      await client.query('CREATE TRIGGER qa_reject_seller_review_audit_trg BEFORE INSERT ON "AdminActivityLog" FOR EACH ROW WHEN (NEW."action" = \'SELLER_REVIEW\') EXECUTE FUNCTION qa_reject_seller_review_audit()');
      auditTrigger = true;
      const rejected = await ctx.request.patch(url,{data:{id,verificationStatus:"APPROVED",commissionBps:0}});
      assert.equal(rejected.status(),500,"Audit failure must roll back Seller verification and User activation");
      assert.equal((await rejected.json()).error,"Unexpected admin server error.");
      assert.deepEqual((await read()).rows[0],before,"No Seller/User data may change after audit failure");
      await client.query('DROP TRIGGER qa_reject_seller_review_audit_trg ON "AdminActivityLog"');
      await client.query("DROP FUNCTION qa_reject_seller_review_audit()");
      auditTrigger = false;

      const requests = await Promise.all([
        ctx.request.patch(url,{data:{id,verificationStatus:"APPROVED",commissionBps:0}}),
        ctx.request.patch(url,{data:{id,verificationStatus:"APPROVED",commissionBps:0}}),
      ]);
      assert.deepEqual(requests.map(r=>r.status()),[200,200],"Both identical Owner review retries succeed");
      assert.equal((await Promise.all(requests.map(r=>r.json()))).filter(r=>r.data.unchanged === false).length,1,
        "Only first approval can produce the audit");
      const accepted = (await read()).rows[0];
      assert.equal(accepted.verificationStatus,"APPROVED");
      assert.equal(accepted.userStatus,"ACTIVE");
      assert.equal(accepted.commissionBps,0);
      assert.equal(accepted.payoutStatus,"HOLD","Approval cannot unlock payout");
      const count = async () => (await client.query('SELECT count(*)::int AS n FROM "AdminActivityLog" WHERE "action"=$1 AND "entityId"=$2',["SELLER_REVIEW",id])).rows[0].n;
      assert.equal(await count(),1);
      const noChange = await api(ctx,"/api/admin-app/sellers","PATCH",{id,verificationStatus:"APPROVED",commissionBps:0});
      assert.equal(noChange.unchanged,true);
      assert.equal(await count(),1);
      await api(ctx,"/api/admin-app/sellers","PATCH",{id,verificationStatus:"REJECTED"});
      assert.equal((await read()).rows[0].userStatus,"SUSPENDED");
      assert.equal((await read()).rows[0].payoutStatus,"HOLD");
      assert.equal(await count(),2);
    } finally {
      if(auditTrigger)await client.query('DROP TRIGGER IF EXISTS qa_reject_seller_review_audit_trg ON "AdminActivityLog"');
      await client.query("DROP FUNCTION IF EXISTS qa_reject_seller_review_audit()");
      await client.query('DELETE FROM "AdminActivityLog" WHERE "entityId" IN (SELECT "id" FROM "SellerProfile" WHERE "userId" IN (SELECT "id" FROM "User" WHERE "email"=$1))',[email]);
      await client.query('DELETE FROM "SellerProfile" WHERE "userId" IN (SELECT "id" FROM "User" WHERE "email"=$1)',[email]);
      await client.query('DELETE FROM "User" WHERE "email"=$1',[email]);
      await client.end();
    }
  });

  await ctx.close();
} finally {
  await browser.close();
  writeFileSync(join(evidence, "results.json"), JSON.stringify({ localOnly: true, qaDatabase: "nexora_qa", results }, null, 2));
}
console.log("ADMIN BROWSER RESULTS", results.filter(v => v.result === "PASS").length, "PASS /", results.filter(v => v.result === "FAIL").length, "FAIL");
