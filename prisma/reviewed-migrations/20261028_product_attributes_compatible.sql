-- Reviewed additive Cline-compatible specifications schema.
-- DO NOT APPLY TO PRODUCTION without final integrated migration review.
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "attributes" JSONB;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AttributeType') THEN
    CREATE TYPE "AttributeType" AS ENUM
      ('TEXT','NUMBER','SELECT','MULTI_SELECT','BOOLEAN','COLOR','DATE','IMAGE_REQUEST');
  END IF;
END $$;
CREATE TABLE IF NOT EXISTS "AttributeDefinition" (
  "id" TEXT NOT NULL,
  "categoryId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "type" "AttributeType" NOT NULL DEFAULT 'TEXT',
  "required" BOOLEAN NOT NULL DEFAULT FALSE,
  "options" JSONB,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "active" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AttributeDefinition_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "AttributeDefinition_categoryId_slug_key"
  ON "AttributeDefinition" ("categoryId", "slug");
CREATE INDEX IF NOT EXISTS "AttributeDefinition_categoryId_active_sortOrder_idx"
  ON "AttributeDefinition" ("categoryId", "active", "sortOrder");
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AttributeDefinition_categoryId_fkey') THEN
    ALTER TABLE "AttributeDefinition" ADD CONSTRAINT "AttributeDefinition_categoryId_fkey"
    FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
