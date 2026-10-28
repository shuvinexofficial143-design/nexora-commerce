# NEXORA 4 — Admin Development Handoff

**Date:** 2026-10-28
**Repository:** `shuvinexofficial143-design/nexora-commerce`
**WRITE BRANCH ONLY:** `feature/nexora-gift-store`
**CI-verified functional HEAD:** `5359f951033c8ee57ae18332613ec78915a5ae3f`
**CI:** https://github.com/shuvinexofficial143-design/nexora-commerce/actions/runs/40679888720 — 4/4 PASS.
**Owner Chromium E2E:** **14 PASS / 0 FAIL**. Documentation-only HEAD postdates the tested functional commit; check latest remote HEAD + exact CI before next changes.

## Current milestone

- Homepage CMS: `components/admin/banner-preview.tsx` (Desktop/Mobile live unsaved preview), `components/admin/cms-hero-editor.tsx` (create/edit, error handling, Archive/Restore as Draft, confirm and busy guards), `lib/home-banners.ts` (image HTTPS allowlist, internal CTA validation, integer ordering and forced unpublished if archived); `tests/home-banner-validation.test.ts` for strict backend checks.
- `scripts/qa/admin-browser-e2e.mjs` added 4 verified steps:
  1. Explicit **QA-only** PostgreSQL trigger on `AdminActivityLog` rejects inserted PRODUCT_BULK_FEATURE record, API gives 500 and product mutation is rolled back; trigger function removed on cleanup.
  2. Two simultaneous bulk operations using one selected Product revision: exactly one 200 and one 409; only one product state field changes.
  3. Media Sign API with no Cloudinary configuration -> 503, Browser displays error. Fake signature and fully Playwright-intercepted Cloudinary HTTP error -> UI error, no added image. **No real provider calls.**
  4. Real Owner Browser Homepage Banner draft preview (no persistence), create, publish, archive and restore; Restore remains Draft.
- Prior Admin Owner Product CRUD, dynamic attributes, gallery, category/brand full lifecycle, bulk UI, checkout, front-end storefront tests all preserved. **14 PASS / 0 FAIL** at `5359f951033c8ee57ae18332613ec78915a5ae3f`.
- Exact-HEAD GitHub workflow 4/4 green including Security/TypeScript/ESLint/build and disposable Postgres.

## Mandatory limits
- Only `feature/nexora-gift-store`; do not modify, merge, deploy Nexora 3 `feature/nexora-gpt-customer-ops` or QA `feature/nexora-qa-automation`.
- No production Vercel deployment, live DB migrations, Cashfree/refund actions, real Cloudinary uploads, inventory edits or checkout reservation contract changes without express authorization.
- `prisma/reviewed-migrations/20261028_admin_observability.sql` is reviewed but **not deployed to production**; Admin raw audit/notifications schema must be applied with approved process, backup and checks before real Owner Product writes.
- Other catalog/banner schema migrations also not applied to production.
- Never hide failed audit writes, never fake browser/provider verification, maintain fail-closed `nexora_qa` isolation and GitHub CI exact-HEAD green.

## Next `next`

1. Verify latest branch SHA, CI jobs and this handoff.
2. Continue Admin Homepage CMS content management including sorting and banner preview/failed media states, or strengthen Product Admin required-attribute publish path, transactional audit and controlled test evidence.
3. Add meaningful real code, Owner browser/API regressions and update Progress/Handoff; CI PASS before claiming.
4. No production deploy or real secret-consuming provider checks without explicit authorization.
