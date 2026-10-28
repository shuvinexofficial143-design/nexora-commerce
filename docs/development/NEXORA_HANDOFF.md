# NEXORA 4 — Admin Development Handoff

**Date:** 2026-10-28
**Repository:** `shuvinexofficial143-design/nexora-commerce`
**Write branch ONLY:** `feature/nexora-gift-store`
**Latest CI-verified functional HEAD:** `be78062aaf7be0c69ad300ac7fb0382e86e4e6cc`
**CI run:** https://github.com/shuvinexofficial143-design/nexora-commerce/actions/runs/40673549944 — **4/4 jobs PASS**. Authenticated Owner Browser E2E is **5 PASS / 0 FAIL**.

This document-only commit postdates the tested functional commit; read current remote HEAD and latest CI before writing again.

## New functionality and exact code locations

- `scripts/qa/admin-browser-e2e.mjs` and `.github/workflows/checkout-safety.yml` — real QA owner login, Category/Brand/Attribute creation, Product draft, edit attributes/gallery, save/reload, publish/unpublish to public backend API.
- `components/admin/product-gallery-editor.tsx` — reorder, remove, preview, URL additions, Cloudinary upload hook; `components/admin/personal-admin-app.tsx` wires Create + Edit fields and prevents unchanged empty descriptions from being resent.
- `lib/db/prisma.ts` — bounded reusable PostgreSQL pool, avoids production connection explosion.
- `lib/admin/product-admin.ts` — fallback description on blank optional input. Existing transactional gallery and required-attribute validation preserved.
- `prisma/reviewed-migrations/20261028_admin_observability.sql` and `scripts/qa/setup-admin-observability.mjs` — reviewed raw SQL schema and QA-only local application. Production UNTOUCHED.
- `tests/integration/admin-catalog-postgres.test.ts` — covered optional description fallback and previous attribute/publish/database regression checks.

## Mandatory safety boundaries

- Do not modify, merge or deploy `feature/nexora-gpt-customer-ops` (Nexora 3) or `feature/nexora-qa-automation` (QA).
- Do not deploy production, apply unreviewed SQL, use live Cashfree/refund flows or change checkout/order/variant reservation contracts.
- Existing raw Admin Audit/Notification SQL fails if tables are absent. Prisma db push does not create those raw tables. Controlled migrations are required before any real owner product write; do NOT hide audit errors by swallowing exceptions.
- Current QA requires localhost, `nexora_qa` database/user, ephemeral owner and `NEXORA_QA_ALLOW_DB_INTEGRATION=true`. Keep fail-closed QA isolation.
- Cloudinary upload is wired but NOT externally exercised by E2E; browser tests verify URL-based galleries rather than remote Cloudinary upload service.
- No production web deployment was executed. Old customer/QA branches remain untouched.

## When the user says `next`

1. First fetch latest HEAD/CI; fix any failed job.
2. Review Product Admin bulk operations and gallery preview fallback; implement safe bulk status/featured controls with owner-only auth, validation, confirmations and transactional limits; **avoid bulk stock adjustments** unless checkout reservation invariants are explicitly verified.
3. Add browser/HTTP tests for Category/Brand deactivate/reactivate, Product bulk actions, owner auth rejection, and audit integrity against disposable PostgreSQL.
4. Maintain both progress/handoff docs, preserve earlier commits and avoid Vercel deployment until last.
