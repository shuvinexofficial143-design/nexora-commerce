-- Reviewed, additive CMS migration. Apply later with the normal production migration process.
CREATE TABLE IF NOT EXISTS "HomepageBanner" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "imageUrl" TEXT NOT NULL,
  "mobileImageUrl" TEXT,
  "ctaText" TEXT NOT NULL,
  "ctaHref" TEXT NOT NULL,
  "categorySlug" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "published" BOOLEAN NOT NULL DEFAULT false,
  "archived" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "HomepageBanner_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "HomepageBanner_published_archived_sortOrder_idx" ON "HomepageBanner"("published", "archived", "sortOrder");