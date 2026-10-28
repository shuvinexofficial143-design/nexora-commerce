-- Reviewed additive Admin observability tables.
-- DO NOT apply to production without owner review, database backup and migration approval.
-- These tables are used by existing raw-SQL audit and notification APIs; not represented in Prisma schema.
CREATE TABLE IF NOT EXISTS "AdminActivityLog" (
  "id" TEXT PRIMARY KEY,
  "adminUserId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE RESTRICT,
  "action" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT,
  "summary" TEXT NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "AdminActivityLog_adminUserId_createdAt_idx"
  ON "AdminActivityLog" ("adminUserId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "AdminActivityLog_entityType_entityId_idx"
  ON "AdminActivityLog" ("entityType", "entityId");

CREATE TABLE IF NOT EXISTS "AdminNotification" (
  "id" TEXT PRIMARY KEY,
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "entityType" TEXT,
  "entityId" TEXT,
  "severity" TEXT NOT NULL DEFAULT 'INFO',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "readAt" TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS "AdminNotification_readAt_createdAt_idx"
  ON "AdminNotification" ("readAt", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "AdminNotification_entity_idx"
  ON "AdminNotification" ("type", "entityType", "entityId");
