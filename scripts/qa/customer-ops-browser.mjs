#!/usr/bin/env node
// Customer-ops privacy and responsive UI checks. Never emails, charges or queries production.
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const base = new URL(process.env.NEXORA_QA_BASE_URL || "http://127.0.0.1:3137/");
const root = process.env.NEXORA_QA_PLAYWRIGHT_DIR;
const evidence = process.env.NEXORA_QA_EVIDENCE_DIR || "/tmp/nexora-customer-ops-evidence";
if (!["localhost", "127.0.0.1", "::1", "[::1]"].includes(base.hostname)
  || !root || base.pathname !== "/" || base.username || base.password) {
  throw new Error("Customer-ops browser tests run on isolated localhost only");
}
mkdirSync(evidence, { recursive: true });
const { chromium } = await import(pathToFileURL(join(root, "node_modules/playwright/index.mjs")).href);
const browser = await chromium.launch({ headless: true });
const results = [];
try {
  for (const [name, viewport] of [
    ["desktop", { width: 1366, height: 900 }],
    ["mobile", { width: 390, height: 844 }],
  ]) {
    const context = await browser.newContext({ viewport, serviceWorkers: "block" });
    const page = await context.newPage();
    try {
      const response = await page.goto(new URL("/track-order", base).href, { waitUntil: "domcontentloaded" });
      assert.equal(response?.status(), 200);
      await page.getByRole("heading", { name: "Track your order" }).waitFor();
      await page.getByRole("button", { name: "Send verification code" }).waitFor();
      await page.getByText(/one-time code to your checkout email/i).waitFor();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
      assert.equal(overflow, false, "Tracking form must fit the viewport");
      const unauthorized = await page.evaluate(async () => {
        const r = await fetch("/api/backend/orders/track?order=NX-20261021-ABCD1234&email=someone@example.com", {
          cache: "no-store",
        });
        return { status: r.status, body: await r.json() };
      });
      assert.equal(unauthorized.status, 401);
      assert.equal(unauthorized.body.ok, false);
      assert.equal("data" in unauthorized.body, false);
      // Real Chromium checks for working customer-side product search.
      const searchPage = await page.goto(new URL("/search?q=airwave", base).href, { waitUntil: "domcontentloaded" });
      assert.equal(searchPage?.status(), 200);
      await page.getByRole("heading", { name: "Search Nexora" }).waitFor();
      await page.getByRole("link", { name: /Airwave Max Wireless Headphones/i }).first().waitFor();
      const emptyPage = await page.goto(new URL("/search?q=qa-no-such-product-887722", base).href, { waitUntil: "domcontentloaded" });
      assert.equal(emptyPage?.status(), 200);
      await page.getByText("No matching products found.").waitFor();

      const screenshot = join(evidence, name + "-secure-tracking.png");
      await page.screenshot({ path: screenshot, fullPage: true });
      results.push({ name, passed: true, pageStatus: 200, unauthorizedStatus: 401 });
      console.log("PASS CUSTOMER OPS BROWSER", name, "tracking form and private API");
    } catch (error) {
      const screenshot = join(evidence, name + "-tracking-failed.png");
      await page.screenshot({ path: screenshot, fullPage: true }).catch(() => {});
      results.push({ name, passed: false, message: String(error) });
      console.error("FAIL CUSTOMER OPS BROWSER", name, String(error));
    } finally { await context.close(); }
  }
} finally { await browser.close(); }
writeFileSync(join(evidence, "customer-ops-results.json"), JSON.stringify(results, null, 2) + "\n");
if (results.some(item => !item.passed)) process.exitCode = 1;
