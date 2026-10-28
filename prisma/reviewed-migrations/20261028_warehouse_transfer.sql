-- Reviewed additive schema for transfer history. QA ONLY until backup and owner approval.
-- Not Prisma-managed. Do not run on production automatically.
CREATE TABLE IF NOT EXISTS "WarehouseTransfer" (
  "id" TEXT PRIMARY KEY,
  "fromWarehouseId" TEXT NOT NULL REFERENCES "Warehouse"("id") ON DELETE RESTRICT,
  "toWarehouseId" TEXT NOT NULL REFERENCES "Warehouse"("id") ON DELETE RESTRICT,
  "status" TEXT NOT NULL CHECK ("status" IN ('COMPLETED')),
  "note" TEXT,
  "createdByUserId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE RESTRICT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "WarehouseTransfer_distinct_warehouses" CHECK ("fromWarehouseId" <> "toWarehouseId")
);
CREATE TABLE IF NOT EXISTS "WarehouseTransferItem" (
  "id" TEXT PRIMARY KEY,
  "transferId" TEXT NOT NULL REFERENCES "WarehouseTransfer"("id") ON DELETE CASCADE,
  "productId" TEXT NOT NULL REFERENCES "Product"("id") ON DELETE RESTRICT,
  "quantity" INTEGER NOT NULL CHECK ("quantity" > 0),
  UNIQUE ("transferId", "productId")
);
CREATE INDEX IF NOT EXISTS "WarehouseTransfer_createdAt_idx"
  ON "WarehouseTransfer" ("createdAt" DESC);
CREATE INDEX IF NOT EXISTS "WarehouseTransferItem_productId_idx"
  ON "WarehouseTransferItem" ("productId");
