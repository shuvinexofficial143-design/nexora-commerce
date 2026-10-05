import { randomUUID } from "node:crypto";
import { getPrisma } from "@/lib/db/prisma";

type ReturnRow = Record<string, unknown>;

export async function listReturns() {
  return getPrisma().$queryRaw<ReturnRow[]>`
    select
      r.*,
      o."orderNumber",
      o."paymentMethod",
      o."paymentStatus"::text as "paymentStatus",
      o."status"::text as "orderStatus",
      o."totalMinor",
      u."name" as "customerName",
      u."email" as "customerEmail"
    from "ReturnRequest" r
    join "Order" o on o."id"=r."orderId"
    join "User" u on u."id"=r."userId"
    order by r."createdAt" desc
    limit 100
  `;
}

export async function createReturn(
  orderId: string,
  userId: string,
  reason: string,
  details?: string,
) {
  const id = randomUUID();
  await getPrisma().$executeRaw`
    insert into "ReturnRequest"(
      "id","orderId","userId","reason","details","createdAt","updatedAt"
    )
    values(${id},${orderId},${userId},${reason},${details ?? null},now(),now())
  `;

  return { id };
}

export async function resolveReturn(
  id: string,
  status: string,
  refundMinor: number,
  note: string,
) {
  await getPrisma().$executeRaw`
    update "ReturnRequest"
    set "status"=${status},
        "refundMinor"=${refundMinor},
        "resolutionNote"=${note},
        "updatedAt"=now()
    where "id"=${id}
  `;
}
