-- REVIEW ONLY — do not execute on production without DBA approval.
-- Existing repository has NO prisma/migrations baseline. This SQL is NOT a
-- complete Prisma migration history. Apply only after schema/rollback review.
-- Additive checkout attempt table used for per-customer idempotent checkout.
BEGIN;
CREATE TABLE IF NOT EXISTS "CheckoutAttempt" (
  "id" text PRIMARY KEY,
  "userId" text NOT NULL,
  "key" text NOT NULL,
  "requestHash" text NOT NULL,
  "orderId" text,
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "CheckoutAttempt_userId_key_key"
  ON "CheckoutAttempt" ("userId", "key");
CREATE UNIQUE INDEX IF NOT EXISTS "CheckoutAttempt_orderId_key"
  ON "CheckoutAttempt" ("orderId");
CREATE INDEX IF NOT EXISTS "CheckoutAttempt_createdAt_idx"
  ON "CheckoutAttempt" ("createdAt");
COMMIT;

-- COUPON REVIEW: Prisma schema currently does not include Coupon or CouponRedemption.
-- BEFORE enforcing an orderId unique index in an independently managed schema,
-- review current production metadata and duplicates (READ ONLY):
--
-- SELECT to_regclass('public."Coupon"'), to_regclass('public."CouponRedemption"');
-- SELECT "orderId", count(*) FROM "CouponRedemption"
-- GROUP BY "orderId" HAVING count(*) > 1;
--
-- If reviewed and deduplicated, DBA may separately apply:
-- CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS
--   "CouponRedemption_orderId_qa_unique" ON "CouponRedemption" ("orderId");
-- Do NOT apply the optional command automatically: existing deployment schema is unknown.
