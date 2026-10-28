# NEXORA 4 — Admin Development Handoff

**Date:** 2026-10-28
**Repository:** `shuvinexofficial143-design/nexora-commerce`
**AUTHORIZED WRITE BRANCH ONLY:** `feature/nexora-gift-store`
**Exact CI-verified functional commit:** `50e695c0cd584a1aefc02817f689f87979f25491`
**GitHub Actions:** https://github.com/shuvinexofficial143-design/nexora-commerce/actions/runs/40703912543 — **4/4 PASS**.
**Real Owner Chromium:** **20 PASS / 0 FAIL**.
The docs-only commit follows this functional commit; read the actual latest remote SHA and CI before a new increment.

## Current verified milestone

- `lib/home-banners.ts`: `BannerValidationError` typed only for expected invalid Banner inputs (Title/CTA length, approved HTTPS image URL, internal CTA, integer display order, category slug, invalid object).
- `app/api/admin-app/banners/route.ts`: POST sends actionable HTTP **400** for invalid input and malformed JSON. GET and unknown server errors retain safe generic 500.
- `app/api/admin-app/banners/[bannerId]/route.ts`: PATCH same typed input HTTP 400, no partial invalid write.
- `scripts/qa/admin-browser-e2e.mjs`: Owner Chromium verifies invalid media/CTA/JSON/ordering returns 400 without mutation; total **20/20 PASS**.
- `tests/home-banner-validation.test.ts`: typed validation test.
- Last full functional 4/4 CI success for SHA `50e695c0cd584a1aefc02817f689f87979f25491`, Run `40703912543`; earlier Product Single/Bulk atomic audit, cancel/retry Upload, Homepage ordering, Category/Brand and Storefront regressions remain green.

## Pending next `next`

1. Always verify latest branch SHA and final exact-head 4/4 CI.
2. **Inventory adjustment audit transaction is NOT fixed.** GitHub write for proposed inventory change was blocked and no inventory commit happened. Reassess that source and safety approval rather than assuming the attempted code exists. Avoid production inventory manipulation.
3. Other Admin mutations (Warehouse Transfer, Seller Onboard, Order Status) have separate audit side effects; audit and prioritize risk, build isolated QA regressions. Do not claim atomicity until exact-head CI verifies.
4. Improve safe validation and real mocked signer-abort QA when valuable; update docs and verify CI.
5. No production Vercel deploy, live SQL migrations, Cashfree/refund or Cloudinary calls; never edit `feature/nexora-gpt-customer-ops` or `feature/nexora-qa-automation`.

## Production boundary

- Reviewed `prisma/reviewed-migrations/20261028_admin_observability.sql` and other Homepage/catalog migrations have NOT been applied to production. Controlled approval, backup and migration rehearsal required before real Admin Owner operations.
- All present QA verification uses localhost disposable `nexora_qa`, Owner `@example.invalid` credentials, and intercepts third-party upload paths. No live customer/inventory/payment effects.
