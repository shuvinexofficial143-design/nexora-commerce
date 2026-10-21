# Nexora Checkout Safety — Reviewed Migration and Rollout Requirements

This branch contains fixes for **stock reservation**, **checkout attempt idempotency**, **validation**, **category links** and **coupon usage-limit claim**. It does **not** deploy or migrate production.

## Admin checkpoint

Remote feature branch prior to change: `102733ba70b5ae06b3d9e5e523bf0f27e5e58116`. Existing Admin features are committed to repository history (see PR #5, #10, #18); the October 20 storefront work is retained. GitHub cannot inspect or checkpoint another developer's local staged/unstaged data.

## Schema gate — mandatory before release

The repository has **no `prisma/migrations` baseline**. Prisma schema adds `CheckoutAttempt` with a unique `(userId,key)` index. `prisma db push` is permitted **only** on disposable QA databases. For deployment, a database owner must review the current production schema, take a backup, and apply the additive, reviewed `prisma/reviewed-migrations/20261021_checkout_attempt.sql` using a controlled migration process. A missing table will prevent keyed checkouts; treat this as a release blocker, not an error to ignore.

No destructive SQL or production backfill performed. Legacy orders remain unchanged. Existing callers without a checkout key are supported internally by `createOrder`, but the public order-creation HTTP endpoint requires `Idempotency-Key`. Existing older API clients must update.

## Atomic reservation

Inside one Prisma transaction:
1. Claim the unique checkout attempt (or return an existing order/reject changed payload).
2. Read canonical product prices and aggregate demand across all cart lines of the same product.
3. Insert the order and issue **guarded** `UPDATE "InventoryItem" ... WHERE "onHand"-"reserved" >= required`.
4. Insert reservation movements and coupon redemption.
5. Commit attempt/order/reservation together, or roll back everything.

Guarded updates are done in stable product/inventory order; the transaction rejects even if old read snapshots overstate available stock. The DB row update is the authoritative stock check.

## Coupon caveat

Existing `Coupon` and `CouponRedemption` tables are raw-SQL dependent but **not defined in Prisma schema**. Coupon usage is now claimed with an atomic conditional `UPDATE` inside the order transaction. A distinct-order usage-limit race is guarded by the SQL predicate. Preventing *same-order* duplicate redemption relies on a reviewed unique `orderId` index. Do not run optional coupon SQL against an unknown schema or assume a missing existing constraint.

## Checkout key lifecycle

Client stores only a SHA-256 payload fingerprint plus a UUID key in sessionStorage until successful COD checkout; identical retries use the same key. Changed payloads intentionally rotate the key. The API compares the server-side SHA-256 fingerprint for the same key and user; conflicting reuse returns HTTP 409. An intentional new checkout gets a new key after successful completion.

## Verification boundaries

GitHub Actions uses temporary PostgreSQL and localhost Chromium only; no payment or production credentials. Final release requires migrations, staging deployment and reconciliation of any preexisting negative/onHand/reserved inventory anomalies. The code prevents **new** over-reservation, but does not repair old data.
