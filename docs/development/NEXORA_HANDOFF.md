# NEXORA 4 — Admin Development Handoff

**Date:** 2026-10-28
**Repository:** `shuvinexofficial143-design/nexora-commerce`
**ONLY WRITE BRANCH:** `feature/nexora-gift-store`
**Exact CI-verified functional SHA:** `f8e0107d8224d89cf75488f2835670f8dc96a456`
**CI:** https://github.com/shuvinexofficial143-design/nexora-commerce/actions/runs/40705333053 — **4/4 PASS**.
**Owner Chromium/Postgres:** **21 PASS / 0 FAIL**.
This documentation-only commit will be newer; on next `next`, fetch actual latest HEAD and check exact-head CI.

## New verified milestone: Inventory Adjustment audit and concurrency

- `lib/admin/inventory-admin.ts`: `adjustStock(input, adminUserId?)` remains backward-compatible for direct QA callers. Owner route supplies authenticated ID, causing Stock InventoryItem update + InventoryMovement + Audit insert to commit or roll back as one Prisma transaction.
- `StockAdjustmentError` maps safe business validation to HTTP 400; `StockAdjustmentConflict` maps failed compare-and-swap to HTTP 409. Invalid JSON and anonymous access rejected by the route; unknown DB exceptions remain generic HTTP 500.
- Strict bounds on input integer delta, reason, and resulting stock, with reserve floor. CAS guards original onHand and reserved values.
- `scripts/qa/admin-browser-e2e.mjs` new isolated test uses a QA-created Warehouse and InventoryItem. An audit trigger rejects INVENTORY_ADJUSTMENT and the test verifies no stock or InventoryMovement persisted. It checks valid adjustment with matching audit, concurrency correctness and final cleanup.
- Exact functional run `40705333053`: 4/4 green, 21/21 Owner Browser PASS. Prior Product CRUD/Bulk, Homepage CMS, audit rollback, image upload cancel and Storefront all stay green.

## Next priorities and risks

1. **Warehouse Transfer:** `lib/admin/warehouse-transfer.ts` and `app/api/admin-app/warehouses/transfer/route.ts` remain unchanged: separate audit after transfer commit and potential concurrent source-stock race; the raw SQL includes a suspicious `"COMPLETED"` identifier instead of a string literal and lacks dedicated real QA transfer E2E. Inspect schema and migration before modifying; add isolated tests with rollback and no production writes.
2. Other Admin mutations: Seller onboarding and Order Status have independent audit/notification/email side effects. Audit safety and test boundaries before changing them.
3. No Vercel production deploy, no production SQL migrations, no real Cashfree or Cloudinary calls or real customer inventory changes. QA must remain `localhost/nexora_qa`, Owner `@example.invalid`.
4. Next `next` should make one meaningful safe code + regression increment, commit only to `feature/nexora-gift-store`, update both docs and verify exact-head 4/4 CI. Never touch Nexora 3 `feature/nexora-gpt-customer-ops` or QA `feature/nexora-qa-automation`.

## Production boundary
Catalog/Homepage and `prisma/reviewed-migrations/20261028_admin_observability.sql` are NOT applied in production. A separate backup, migration rehearsal and owner approval are required for production readiness.
