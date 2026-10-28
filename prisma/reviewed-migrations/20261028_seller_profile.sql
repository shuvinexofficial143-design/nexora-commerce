-- Reviewed additive SellerProfile table. Not applied to Production.
-- Apply to a staging copy only after DBA review, backup and owner approval.
-- Prisma schema intentionally omits this raw SQL table.
CREATE TABLE IF NOT EXISTS "SellerProfile" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL UNIQUE REFERENCES "User"("id") ON DELETE RESTRICT,
  "storeName" TEXT NOT NULL,
  "gstNumber" TEXT,
  "commissionBps" INTEGER NOT NULL DEFAULT 1000
    CHECK ("commissionBps" >= 0 AND "commissionBps" <= 10000),
  "verificationStatus" TEXT NOT NULL DEFAULT 'PENDING',
  "payoutStatus" TEXT NOT NULL DEFAULT 'HOLD',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "SellerProfile_verificationStatus_idx"
  ON "SellerProfile" ("verificationStatus", "createdAt" DESC);
-- The table is server-only; do not expose client write access without
-- explicit, audited role-based policies.
ALTER TABLE "SellerProfile" ENABLE ROW LEVEL SECURITY;
