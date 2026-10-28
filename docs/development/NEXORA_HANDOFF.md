# NEXORA 4 — Admin Development Handoff

**Date:** 2026-10-28  
**Repo:** `shuvinexofficial143-design/nexora-commerce`  
**ONLY writable branch:** `feature/nexora-gift-store`  
**CI-verified functional SHA:** `847c3b47890ff7ea0732d1abf321f2962ae43b33`  
**CI:** https://github.com/shuvinexofficial143-design/nexora-commerce/actions/runs/40711986884 — **4/4 PASS**.  
**Owner Chromium, disposable PostgreSQL:** **23 PASS / 0 FAIL**.

## Newly verified: Order Status + Audit + Stock atomicity

- `app/api/admin-app/orders/[orderId]/status/route.ts`: replaces unguarded Order status write with compare-and-swap against previously read status and `updatedAt`. Stale revision returns HTTP **409**, not a partial stock update.
- Updating status, executing `reconcileOrder(tx,...)` for DELIVERED/CANCELLED and writing `ORDER_STATUS_UPDATE` Audit now happen in the **same Prisma transaction**. Any audit/stock failure rolls back everything.
- Post-commit `sendOrderEmailSafe` and terminal status notifications still run after transaction commit, never before. They use `Promise.allSettled`; delivery retry/outbox guarantees are **not** yet implemented. Do not mistake commit success for guaranteed email delivery.
- `scripts/qa/admin-browser-e2e.mjs`: new Owner E2E on **localhost disposable QA DB** creates isolated fake customer, order, OrderItem and reservation. A rejected Audit trigger proves status stays PENDING, Reserved Stock unchanged and no RELEASE/notification; after removing trigger, CANCELLED releases stock once, writes one audit and repeated CANCELLED request is idempotent. QA guard rejects configured Resend email credentials.
- Exact functional CI `40711986884`: **4/4 PASS** and **23/23 Owner Browser PASS**. Other Product, Catalog, Inventory, Warehouse Transfer, Homepage and Storefront checks remain green.

## NEXT milestone and outstanding risks

1. **Seller Onboarding is NOT fixed.** `lib/admin/seller-onboarding.ts` currently sets a hard-coded fallback password, writes raw `"PENDING"` / `"HOLD"` as SQL identifiers, and its API logs Audit in a separate post-commit call. A reviewed `SellerProfile` DDL source has not yet been identified in the repo. Do not enable real onboarding until safely reviewed, migrated and tested. Prioritize explicit secure password, validated Commission BPS and atomic Seller+Profile+Audit with isolated QA.
2. Order Status version guard was verified by code and terminal-state tests, but a dedicated deterministic *concurrent two-Owner status transition* regression and reliable email/notification outbox are still pending.
3. Warehouse Transfer UI `components/admin/warehouse-transfer-panel.tsx` remains Demo-only. Reviewed Warehouse Transfer/Category/Homepage/Audit migrations are NOT applied in production.
4. Next `next`: fetch latest branch SHA and exact CI, preserve tests, code only `feature/nexora-gift-store`, use local disposable QA, update docs, and verify final exact-head 4/4 CI.
5. No Production Vercel deployment, real Cloudinary success verification, Live Cashfree/refunds, real order modifications or migrations. Never touch Nexora 3 `feature/nexora-gpt-customer-ops` or QA `feature/nexora-qa-automation`.

## Production boundary
Require owner approval, backups, migration staging and provider verification before production use. No live customers or emails were affected by QA.
