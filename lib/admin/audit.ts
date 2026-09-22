import { randomUUID } from "node:crypto";
import { getPrisma } from "@/lib/db/prisma";

type AdminActivityRow = Record<string, unknown>;

export async function logAdmin(input: {
  adminUserId: string;
  action: string;
  entityType: string;
  entityId?: string;
  summary: string;
  metadata?: Record<string, unknown>;
}) {
  await getPrisma().$executeRaw`
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
