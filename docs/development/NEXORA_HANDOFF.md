# NEXORA 4 — Admin Development Handoff

**Date:** 2026-10-28
**Repository:** `shuvinexofficial143-design/nexora-commerce`
**ONLY write branch:** `feature/nexora-gift-store`
**Last exact CI-verified functional HEAD:** `ee7d0883aaeb0fd7054225fbb8e16b6b387d257e`
**GitHub Actions:** https://github.com/shuvinexofficial143-design/nexora-commerce/actions/runs/40698685959 — **4/4 PASS**.
**Owner Admin real Chromium E2E:** **17 PASS / 0 FAIL**.
Documentation-only HEAD will follow functional HEAD; always check the actual latest remote SHA and exact CI before changing code.

## Current milestone — Typed Publish Validation and CMS Media Handling

1. `lib/admin/product-publish.ts`: new `ProductPublishValidationError` for **expected** Product Required Attribute, Category and Brand eligibility failures only. Unknown DB failure remains unwrapped and internal.
2. `app/api/admin-app/products/[productId]/route.ts`, `app/api/admin-app/products/bulk/route.ts`: publish validation HTTP **400** and safe actionable message, while true database/audit failures stay generic **500** and optimistic stale bulk requests remain **409**.
3. `components/admin/admin-media-upload.tsx`: Cancel Upload support via AbortController (signature fetch) and XHR abort, visible cancel button during upload, accessible error alert, unmount abort. Existing file type/size/approved URL validation retained.
4. `scripts/qa/admin-browser-e2e.mjs`: single/bulk invalid publish must now return 400 plus required attribute reason; independently test mocked Cloudinary success for CMS Desktop banner and mocked untrusted provider Mobile URL rejection, image preview fallback, and no unsaved DB persistence. Browser E2E **17 PASS / 0 FAIL**; all Cloudinary routes intercepted; no real third-party service calls.
5. GitHub CI full 4/4 success for functional SHA `ee7d0883aaeb0fd7054225fbb8e16b6b387d257e`. Prior Homepage Sort, Category/Brand lifecycle, atomic Bulk Audit/rollback, Storefront tests all still pass.

## Boundaries / unsolved

- Only `feature/nexora-gift-store`; NEVER edit Nexora 3 `feature/nexora-gpt-customer-ops` or QA `feature/nexora-qa-automation`.
- No production Vercel deploy, schema migrations, live Cashfree/refund/gateway calls, real Cloudinary uploads or real customer/order modifications.
- `prisma/reviewed-migrations/20261028_admin_observability.sql` raw Admin audit/notification table DDL plus catalog/banner schema changes are NOT applied to production. Live Owner operations require separately reviewed migration/backups.
- Current Cancel Upload click itself is not yet exercised in automated Browser E2E; avoid claiming otherwise. Admin Product create/update separate audit flow warrants eventual atomicity review.
- Unit and isolated-DB CI never authorize production use.

## Next `next`

1. Fetch branch HEAD and exact CI. Preserve all existing verified commits.
2. Strongly prioritize single Product write + audit atomicity, typed safe validation for input errors, and QA-only rollback tests; do not break existing Bulk Actions transaction guarantees.
3. Extend CMS Mock Upload Cancel/Retry Browser E2E without calling external provider.
4. Implement meaningful safe code/tests, commit only on authorized branch, update Progress/Handoff, verify exact HEAD 4/4 CI. No production deploy.
