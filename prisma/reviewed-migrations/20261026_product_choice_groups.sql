-- Reviewed additive schema for admin-defined selectable product attributes.
-- IMPORTANT: NEVER execute automatically on a production database.
CREATE TABLE IF NOT EXISTS "ProductChoiceGroup" (
  "id" text PRIMARY KEY,
  "productId" text NOT NULL REFERENCES "Product" ("id") ON DELETE CASCADE,
  "key" text NOT NULL,
  "label" text NOT NULL,
  "required" boolean NOT NULL DEFAULT true,
  "values" jsonb NOT NULL,
  "sortOrder" integer NOT NULL DEFAULT 0,
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "ProductChoiceGroup_productId_key_key" ON "ProductChoiceGroup" ("productId","key");
CREATE INDEX IF NOT EXISTS "ProductChoiceGroup_productId_sortOrder_idx" ON "ProductChoiceGroup" ("productId","sortOrder");
