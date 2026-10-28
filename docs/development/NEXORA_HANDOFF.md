# NEXORA 4 — Admin Development Handoff

**Date:** 2026-10-28
**Repository:** `shuvinexofficial143-design/nexora-commerce`
**AUTHORIZED WRITE BRANCH ONLY:** `feature/nexora-gift-store`
**CI-verified functional commit:** `443be5ec2edee780e0c9f5d658f1e1366f91e70e`
**GitHub Actions:** https://github.com/shuvinexofficial143-design/nexora-commerce/actions/runs/40682281288 — **4/4 PASS**, Owner Chromium **16 PASS / 0 FAIL**.
This doc-only commit follows the tested functional commit. On every new `next` read latest remote SHA + CI again.

## Milestone 2026-10-28 — Homepage Order and Publish Validation

- `lib/admin/product-publish.ts`: `assertProductPublishable` validates currently assigned active/visible Category, active Brand and current Category Required Attributes *from persisted Product state* inside Prisma transaction. Uncategorized products remain possible per existing catalog semantics.
- `lib/admin/product-admin.ts`: on resultant `ACTIVE` status, call `assertProductPublishable` inside update transaction. Even status-only PATCH now enforces current required attributes and classifications. No mutation if validation fails.
- `lib/admin/product-bulk.ts`: identical eligibility for Bulk `PUBLISH` inside existing atomic update/audit transaction; unchanged operations still no-op.
- `tests/integration/admin-catalog-postgres.test.ts`: disposable-DB added required Attribute after Product creation, then Single/Bulk Publish denied until fixed; Brand deactivation and Category hiding separately deny publish; after restoring values status transition succeeds.
- `lib/admin/banner-order.ts` + `app/api/admin-app/banners/reorder/route.ts`: POST owner only; 2–100 complete active list of unique IDs with current ISO `updatedAt` revisions. Transaction validates every revision and archives, updates all rank indexes 0..N-1 atomically. Stale returns 409, invalid 400, unauthorized 401. Never resort archived banners.
- `components/admin/cms-hero-editor.tsx`: Arrow reorder controls, loading guard, actual response and recovery, signed image upload UI for Desktop and Mobile. If more than 100 unarchived banners, controls fail closed.
- `tests/banner-reorder.test.ts`: validates strict request parser. `scripts/qa/admin-browser-e2e.mjs`: 2 new tests for real CMS sort/revision/rejection/Upload error and new Required Attribute Publish Single/Bulk validation.
- CI exact functional commit `443be5ec2edee780e0c9f5d658f1e1366f91e70e` 4/4 green with 16 passing Owner browser tests. Previous Category/Brand, Product CRUD, Bulk, QA rollback, checkout/stock, Homepage CRUD remain PASS.

## Known limitations / blockers

- Single/Bulk eligibility rejection is currently safe against data change but surfaced to browser as existing generic HTTP 500 (not user-friendly typed HTTP 400); consider error classification with tests on next increment.
- External Cloudinary upload SUCCESS has NOT been exercised; failed/missing-credential paths alone tested in isolated QA.
- Reviewed migration SQL: `prisma/reviewed-migrations/20261028_admin_observability.sql` and previous HomepageBanner/catalog structures are NOT deployed to production. Do not run production Prisma db push/migrations automatically. Real Admin Owner writes require owner-approved backups and migration runbook.

## Rules for next NEXT

1. Fetch latest exact HEAD, CI status and this handoff.
2. Prioritize typed Owner API validation errors for Product publish (400 vs generic 500), re-check audit contract, add real Browser/API regression for correct error without leaking data.
3. Consider Home CMS media uploads preview validation and further optimistic concurrency, and accessible sorting states.
4. Commit meaningful real code+tests only to `feature/nexora-gift-store`, update both progress/handoff, verify exact-head GitHub CI.
5. No production deploy, no live database migration, no real Cloudinary or payments/refunds, no changes to Nexora 3 or QA branches.
