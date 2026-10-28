# NEXORA 4 — Admin Development Handoff

**Date:** 2026-10-28
**Repository:** `shuvinexofficial143-design/nexora-commerce`
**Authorized write branch ONLY:** `feature/nexora-gift-store`
**Latest CI-verified functional HEAD:** `0cf11d3263b8ec8a39191f624166660675a14a2b`
**CI:** https://github.com/shuvinexofficial143-design/nexora-commerce/actions/runs/40677403764 — **4/4 PASS**.
**Owner Chromium (disposable PostgreSQL) 10 PASS / 0 FAIL.**
Note: the documentation commit containing this handoff is newer. Read actual latest branch SHA and CI on each subsequent `next`.

## New milestone: Product Preview and catalog lifecycle Browser QA

- `components/admin/product-preview.tsx`: live unsaved Admin Preview, gallery thumbnails, price/status/description and image-error placeholder. Product Create and Edit both render Preview via `components/admin/personal-admin-app.tsx`.
- `components/admin/product-gallery-editor.tsx`: safe reusable image fallback on broken URLs.
- `components/admin/admin-media-upload.tsx`: zero-byte rejection, XHR timeout, cancellation/unmount abort, safe returned URL validation and input cleanup.
- `scripts/qa/admin-browser-e2e.mjs`: new tests for draft preview without DB writes, image-error fallback and rejected empty upload; real Category UI hide/show/edit/archive/restore; real Brand UI edit/deactivate/reactivate. Real Browser run had **10 passing tests**.
- Existing Owner Login/Product Create/Edit/Gallery/Bulk Actions/publish/unpublish tests still PASS.
- Existing `feature/nexora-gift-store` CI 4 jobs all PASS, SHA `0cf11d3263b8ec8a39191f624166660675a14a2b`.

## Safety and deployment limits

- Do not write, merge or deploy Nexora 3 `feature/nexora-gpt-customer-ops` or QA `feature/nexora-qa-automation`.
- No production Vercel deploy, migration or live Cashfree/refund flow; never alter checkout reservations, order identities, variant contract, or inventory calculations in Admin-specific development.
- `prisma/reviewed-migrations/20261028_admin_observability.sql` plus previous catalog/banner migration SQL remains **not applied** to production. Admin raw audit/notification tables require controlled migration approval; `prisma db push` does not create those raw tables.
- Browser tests use isolated `localhost`, disposable user/database `nexora_qa`, and explicit safety guards. Do not remove.
- Real third-party Cloudinary uploads NOT yet verified; this increment tests invalid/empty browser file paths and preview only. Do not claim upload provider E2E success.

## Next `next`

1. Read remote HEAD and exact-HEAD CI first.
2. Investigate atomic audit failure rollback and simultaneous bulk-update requests with disposable DB; add meaningful regression.
3. Test upload signer invalid/missing credentials and browser upload failure states with local interception only, no real external Cloudinary traffic.
4. Extend Homepage CMS editing and local preview and other Admin functions as appropriate. Implement code + tests + CI, document findings, do not deploy to production.
