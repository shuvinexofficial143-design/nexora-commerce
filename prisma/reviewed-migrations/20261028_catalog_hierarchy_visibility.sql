-- Additive Cline-compatible Category hierarchy/Brand state.
-- Intentionally NOT applied to production. Requires owner-approved integrated migration.
ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;
ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "sortOrder" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "visible" BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "archived" BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "parentId" TEXT;
ALTER TABLE "Brand" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "Brand" ADD COLUMN IF NOT EXISTS "logoUrl" TEXT;
ALTER TABLE "Brand" ADD COLUMN IF NOT EXISTS "active" BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE "Brand" ADD COLUMN IF NOT EXISTS "featured" BOOLEAN NOT NULL DEFAULT FALSE;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Category_parentId_fkey') THEN
    ALTER TABLE "Category" ADD CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId")
      REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS "Category_parentId_visible_archived_sortOrder_idx"
  ON "Category" ("parentId", "visible", "archived", "sortOrder");
