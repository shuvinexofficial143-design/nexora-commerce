-- REVIEWED ADDITIVE SQL ONLY — NOT EXECUTED ON PRODUCTION.
-- The repository has no historical Prisma migration baseline.
-- Use in a reviewed, backed-up rollout after examining actual production schema.
BEGIN;
CREATE TABLE IF NOT EXISTS "OrderTrackingChallenge" (
  "id" text PRIMARY KEY,
  "orderId" text NOT NULL REFERENCES "Order" ("id") ON DELETE CASCADE,
  "codeHash" text NOT NULL,
  "attempts" integer NOT NULL DEFAULT 0,
  "expiresAt" timestamp(3) NOT NULL,
  "verifiedAt" timestamp(3),
  "accessTokenHash" text,
  "accessExpiresAt" timestamp(3),
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "OrderTrackingChallenge_accessTokenHash_key"
  ON "OrderTrackingChallenge" ("accessTokenHash");
CREATE INDEX IF NOT EXISTS "OrderTrackingChallenge_orderId_createdAt_idx"
  ON "OrderTrackingChallenge" ("orderId", "createdAt");
CREATE INDEX IF NOT EXISTS "OrderTrackingChallenge_expiresAt_idx"
  ON "OrderTrackingChallenge" ("expiresAt");
CREATE INDEX IF NOT EXISTS "OrderTrackingChallenge_accessExpiresAt_idx"
  ON "OrderTrackingChallenge" ("accessExpiresAt");
COMMIT;

-- Unexpired rows are read by id and token hash. A future scheduled database
-- maintenance process may purge expired challenges according to retention policy.
-- No production cleanup job, schema alterations or customer data migration is run here.
