import { randomUUID } from "node:crypto";
import { getPrisma } from "@/lib/db/prisma";
import type { Prisma } from "@/generated/prisma/client";

type AdminActivityRow = Record<string, unknown> & { createdAt: Date };

export async function logAdmin(input: {
  adminUserId: string;
  action: string;
  entityType: string;
  entityId?: string;
  summary: string;
  metadata?: Record<string, unknown>;
}, executor?: Pick<Prisma.TransactionClient, "$executeRaw">) {
  // The supplied executor keeps Product + media + audit in the SAME transaction.
  // Existing standalone callers remain compatible.
  const db = executor ?? getPrisma();
  await db.$executeRaw`
    insert into "AdminActivityLog" ("id","adminUserId","action","entityType","entityId","summary","metadata","createdAt")
    values (
      ${randomUUID()},
      ${input.adminUserId},
      ${input.action},
      ${input.entityType},
      ${input.entityId ?? null},
      ${input.summary},
      ${input.metadata ? JSON.stringify(input.metadata) : null}::jsonb,
      now()
    )`;
}

export async function getAdminActivity() {
  return getPrisma().$queryRaw<AdminActivityRow[]>`
    select l.*,u."name" as "adminName",u."email" as "adminEmail"
    from "AdminActivityLog" l
    join "User" u on u."id"=l."adminUserId"
    order by l."createdAt" desc
    limit 50`;
}
