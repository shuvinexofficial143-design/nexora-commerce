#!/usr/bin/env node
// Actual Chromium E2E against isolated localhost Next.js only. Never submits orders or payments.
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const base = new URL(process.env.NEXORA_QA_BASE_URL || "http://127.0.0.1:3137/");
const root = process.env.NEXORA_QA_PLAYWRIGHT_DIR;
const evidence = process.env.NEXORA_QA_EVIDENCE_DIR || "/tmp/nexora-qa-browser-evidence";
if (!["localhost", "127.0.0.1", "::1", "[::1]"].includes(base.hostname) || !root || base.pathname !== "/" || base.username || base.password) {
  throw new Error("Chromium QA requires explicitly isolated localhost and ephemeral Playwright install");
}
mkdirSync(evidence, { recursive: true });
const { chromium } = await import(pathToFileURL(join(root, "node_modules/playwright/index.mjs")).href);
const browser = await chromium.launch({ headless: true });
const results = [];

async function verify(name, page, callback) {
  const started = Date.now();
  try {
    await callback();
    results.push({ name, status: "PASS", elapsedMs: Date.now() - started });
    console.log("PASS BROWSER", name);
  } catch (error) {
    const filename = name.toLowerCase().replace(/[^a-z0-9]+/g, "-") + ".png";
    try { await page.screenshot({ path: join(evidence, filename), fullPage: true, timeout: 5000 }); } catch {}
    results.push({ name, status: "FAIL", elapsedMs: Date.now() - started, message: error instanceof Error ? error.message : String(error), screenshot: filename });
    console.error("FAIL BROWSER", name, error instanceof Error ? error.message : String(error));
  }
}

async function waitForLocalServer() {
  for (let attempt = 0; attempt < 40; attempt++) {
    try {
      const response = await fetch(base, { redirect: "manual", signal: AbortSignal.timeout(3000) });
      if (response.status === 200) return;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  throw new Error("Local browser server did not become healthy within bounded polling time");
}

await waitForLocalServer();
try {
  for (const [name, viewport] of [
    ["desktop", { width: 1366, height: 900 }],
    ["mobile", { width: 390, height: 844 }],
  ]) {
    const context = await browser.newContext({ viewport, serviceWorkers: "block" });
    const page = await context.newPage();
    page.setDefaultTimeout(10_000);
    page.setDefaultNavigationTimeout(20_000);
    try {
      await verify(name + " homepage render", page, async () => {
        const response = await page.goto(new URL("/", base).href, { waitUntil: "domcontentloaded" });
        assert.equal(response?.status(), 200);
        await page.locator("body").waitFor({ state: "visible" });
        assert.match(await page.title(), /nexora/i);
      });
      await verify(name + " category navigation", page, async () => {
        await page.goto(new URL("/", base).href, { waitUntil: "domcontentloaded" });
        const link = page.locator('a[href="/shop?category=electronics"]:visible').first();
        await link.waitFor();
        const href = await link.getAttribute("href");
        assert.ok(href);
        const response = await page.goto(new URL(href, base).href, { waitUntil: "domcontentloaded" });
        assert.equal(response?.status(), 200, "Visible home category link must have a valid destination");
      });
      await verify(name + " search and zero-result state", page, async () => {
        const response = await page.goto(new URL("/search?q=qa-no-such-product-887722", base).href, { waitUntil: "domcontentloaded" });
        assert.equal(response?.status(), 200);
        await page.getByText("No matching products found.").waitFor();
      });
      await verify(name + " shop catalog and product detail", page, async () => {
        const response = await page.goto(new URL("/shop", base).href, { waitUntil: "domcontentloaded" });
        assert.equal(response?.status(), 200);
        await page.locator('a[href^="/product/"]').first().waitFor();
        const product = await page.goto(new URL("/product/airwave-max-headphones", base).href, { waitUntil: "domcontentloaded" });
        assert.equal(product?.status(), 200);
        await page.getByRole("button", { name: /^Add to cart$/i }).first().waitFor();
      });
      await verify(name + " add to cart and quantity changes", page, async () => {
        await page.goto(new URL("/product/airwave-max-headphones", base).href, { waitUntil: "domcontentloaded" });
        await page.getByRole("button", { name: /^Add to cart$/i }).first().click();
        await page.goto(new URL("/cart", base).href, { waitUntil: "domcontentloaded" });
        await page.getByRole("heading", { name: "Your cart" }).waitFor();
        await page.getByRole("button", { name: "Increase quantity" }).first().click();
        await page.getByText(/2 items/i).first().waitFor();
      });
      await verify(name + " verified checkout preview fails closed without production database", page, async () => {
        const response = await page.goto(new URL("/checkout", base).href, { waitUntil: "domcontentloaded" });
        assert.equal(response?.status(), 200);
        await page.getByText("Live price & stock verification").waitFor();
        await page.getByText("Checkout will remain blocked until verification succeeds.").waitFor({ timeout: 12000 });
        assert.equal(await page.getByText("Priority same-day").count(), 0);
        assert.equal(await page.getByText("Express delivery").count(), 0);
        const forbidden = await page.evaluate(async () => {
          const response = await fetch("/api/backend/checkout/preview", {
            method: "POST", headers: { "content-type": "application/json" },
            body: JSON.stringify({ items: [{ slug: "qa-test", quantity: 1 }], deliveryMethod: "priority" }),
          });
          return { status: response.status, body: await response.json() };
        });
        assert.equal(forbidden.status, 400);
        assert.match(forbidden.body.error, /standard delivery/i);
        assert.equal(new URL(page.url()).pathname, "/checkout");
      });
      await verify(name + " invalid checkout stays local and creates no order", page, async () => {
        await page.goto(new URL("/checkout", base).href, { waitUntil: "domcontentloaded" });
        const button = page.getByRole("button", { name: /Place COD order/i });
        await button.waitFor();
        await button.click();
        await page.getByText("Enter a valid email address for order updates.").waitFor();
        assert.equal(new URL(page.url()).pathname, "/checkout");
      });

      // Mock ONLY the recovery lookup. All real order-create/payment endpoints
      // remain untouched and MUST NOT be called by these read-only test flows.
      const attempt = { fingerprint: "a".repeat(64),
        key: "4d55ebaa-530e-4e57-a3b2-007ab9b43311", email: "recovery@example.invalid" };
      const storageKey = "nexora-checkout-attempt-v1";
      async function setAttempt(value) {
        await page.goto(new URL("/checkout", base).href, { waitUntil: "domcontentloaded" });
        await page.evaluate(([key, val]) => {
          if (val === null) sessionStorage.removeItem(key);
          else sessionStorage.setItem(key, JSON.stringify(val));
        }, [storageKey, value]);
      }
      await verify(name + " recovered cancelled order uses OTP tracking, not false success", page, async () => {
        let recoveryReads = 0;
        let orderPosts = 0;
        await page.route("**/api/backend/orders/recover", async route => {
          recoveryReads++;
          assert.equal(route.request().method(), "POST");
          assert.deepEqual(route.request().postDataJSON(), { key: attempt.key, email: attempt.email });
          await route.fulfill({ status: 200, contentType: "application/json",
            headers: { "cache-control": "private, no-store" }, body: JSON.stringify({
              ok: true, data: { orderNumber: "NX-20261028-ABCD1234",
                status: "CANCELLED", paymentMethod: "cod", paymentStatus: "FAILED" },
            }) });
        });
        await page.route("**/api/backend/orders", route => {
          if (route.request().method() === "POST") orderPosts++;
          return route.abort();
        });
        await setAttempt(attempt);
        await page.reload({ waitUntil: "domcontentloaded" });
        await page.getByText("Existing checkout attempt detected").waitFor();
        await page.getByText(/Order NX-20261028-ABCD1234/).waitFor();
        await page.getByText(/This order already exists/).waitFor();
        const verifyLink = page.getByRole("link", { name: "Verify order status" });
        assert.equal(await verifyLink.getAttribute("href"), "/track-order");
        assert.equal(await page.getByRole("button", { name: /^Resume payment$/ }).count(), 0);
        await page.getByRole("button", { name: /Resolve previous checkout first/ }).waitFor();
        assert.equal(await page.getByRole("button", { name: /Resolve previous checkout first/ }).isDisabled(), true);
        assert.ok(recoveryReads >= 1);
        assert.equal(orderPosts, 0, "Recovery must not create a second order");
        await page.unroute("**/api/backend/orders");
        await page.unroute("**/api/backend/orders/recover");
      });
      await verify(name + " unknown checkout attempt remains blocked until explicit separation", page, async () => {
        let recoveryReads = 0;
        await page.route("**/api/backend/orders/recover", async route => {
          recoveryReads++;
          await route.fulfill({ status: 404, contentType: "application/json",
            body: JSON.stringify({ ok: false, error: "No completed order matches this checkout attempt." }) });
        });
        await setAttempt(attempt);
        await page.reload({ waitUntil: "domcontentloaded" });
        await page.getByText(/No completed order is visible yet/).waitFor();
        assert.equal(await page.getByRole("button", { name: /Resolve previous checkout first/ }).isDisabled(), true);
        assert.equal(await page.getByRole("button", { name: /Retry exact same order safely/ }).count(), 0);
        await page.getByRole("button", { name: "Check previous attempt" }).click();
        await page.getByText(/No completed order is visible yet/).waitFor();
        assert.ok(recoveryReads >= 2, "Manual refresh must actually call server");
        await page.getByRole("button", { name: "Start separate checkout" }).click();
        const stored = await page.evaluate(key => sessionStorage.getItem(key), storageKey);
        assert.equal(stored, null, "Explicit separate checkout must revoke old local key");
        assert.equal(await page.getByRole("button", { name: /Resolve previous checkout first/ }).count(), 0);
        await page.unroute("**/api/backend/orders/recover");
      });
      await verify(name + " recovery service failure fails closed with no new order", page, async () => {
        await page.route("**/api/backend/orders/recover", route => route.fulfill({
          status: 503, contentType: "application/json",
          body: JSON.stringify({ ok: false, error: "Service unavailable." }),
        }));
        await setAttempt(attempt);
        await page.reload({ waitUntil: "domcontentloaded" });
        await page.getByText(/previous checkout could not be verified/i).waitFor();
        assert.equal(await page.getByRole("button", { name: /Resolve previous checkout first/ }).isDisabled(), true);
        assert.equal(await page.getByRole("button", { name: /Retry exact same order safely/ }).count(), 0);
        await page.unroute("**/api/backend/orders/recover");
      });
      await verify(name + " corrupted checkout attempt is discarded without recovery request", page, async () => {
        let recoveryReads = 0;
        await page.route("**/api/backend/orders/recover", async route => {
          recoveryReads++;
          await route.abort();
        });
        await setAttempt({ ...attempt, key: "../invalid" });
        await page.reload({ waitUntil: "domcontentloaded" });
        await page.getByText("Live price & stock verification").waitFor();
        await page.waitForTimeout(250);
        assert.equal(recoveryReads, 0);
        assert.equal(await page.getByText("Existing checkout attempt detected").count(), 0);
        await page.evaluate(key => sessionStorage.removeItem(key), storageKey);
        await page.unroute("**/api/backend/orders/recover");
      });

    } finally {
      await context.close();
    }
  }
} finally {
  await browser.close();
}
writeFileSync(join(evidence, "results.json"), JSON.stringify({ browser: "Chromium", base: base.origin, results }, null, 2) + "\n");
const passed = results.filter(x => x.status === "PASS").length, failed = results.length - passed;
console.log(`BROWSER RESULTS: ${passed} PASS / ${failed} FAIL / ${results.length} total (desktop + mobile)`);
if (failed) process.exitCode = 1;
