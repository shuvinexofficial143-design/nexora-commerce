# NEXORA 4 — Admin Development Handoff

Date: 2026-10-28
Repository: `shuvinexofficial143-design/nexora-commerce`
**WRITE ONLY:** `feature/nexora-gift-store`
**Verified functional SHA:** `304530352f15d0e0865c3143b85add166b5dbbe1`
**CI:** https://github.com/shuvinexofficial143-design/nexora-commerce/actions/runs/40715987552 — **4/4 PASS**.
**Real Owner Chromium / disposable PostgreSQL:** **24 PASS / 0 FAIL**.
This document will get a newer docs-only commit; verify actual latest HEAD/CI on every `next`.

## Verified milestone: Secure Seller Onboarding

1. Added `prisma/reviewed-migrations/20261028_seller_profile.sql` with additive SellerProfile table, unique User foreign key, bounded commission and server-only RLS. **Production schema NOT migrated**. `scripts/qa/setup-admin-observability.mjs` applies it ONLY in explicitly opt-in localhost `nexora_qa`.
2. `lib/admin/seller-onboarding.ts`: removes shared default credential, requires explicitly supplied 12–128-character password with letter, number and symbol; rejects previous shared default. Validates email/name/store, optional GST format, and commission integer 0–10000 bps (explicit 0 supported). Password is salted/scrypt hashed before transaction and never returned.
3. Creates User, SellerProfile and exactly one `SELLER_ONBOARD` Audit inside a single Prisma transaction; any error rolls back all three. Parameterizes PENDING and HOLD correctly in SQL. Duplicate seller email returns typed conflict.
4. `app/api/admin-app/sellers/onboard/route.ts`: Owner-only 401; malformed/invalid input 400; duplicate 409; unexpected DB/audit error generic 500; success 201 has only userId/profileId/email.
5. `scripts/qa/admin-browser-e2e.mjs`: one new real browser/API/Postgres test rejects anonymous/weak/missing password/invalid commission/malformed JSON; deliberately fails Audit insert and verifies no orphan User/Profile; proves valid seller created with hashed password, pending verification/HOLD payout, commission 0, one audit and duplicate 409. Cleans QA data.
6. Functional CI `40715987552` is 4/4 success and Owner Chromium **24/24 PASS**, all older Admin/Storefront/Checkout regressions preserved.

## Remaining and next

- Seller *approval/update* route `app/api/admin-app/sellers/route.ts` and `lib/admin/sellers.ts` still accept broadly coerced input and lack atomic admin audit. Review and secure as next increment; do not bypass approval controls.
- Order status post-commit customer emails and Admin notifications are still best-effort; durable outbox/retry not implemented. Deterministic simultaneous Order Status update test still missing.
- Seller onboarding creates an ACTIVE User with SellerProfile verificationStatus PENDING; verify business approval/login authorization semantics before enabling multi-vendor production.
- Warehouse Transfer admin UI remains DEMO-only. Reviewed SellerProfile, Warehouse Transfer, Admin Observability, Catalog and Homepage SQL remain unapplied to Production.
- No Vercel Production deployment, live Cloudinary, Cashfree/refund, emails, real seller account or stock/customer changes.
- Next `next`: verify latest head and 4/4 CI; implement safe owner Admin improvements with disposable QA tests; update both docs.
- Never modify `feature/nexora-gpt-customer-ops` or `feature/nexora-qa-automation`.

Production needs explicit owner approval, schema diff review, database backup and staging rehearsal.
