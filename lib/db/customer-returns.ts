import { randomUUID } from "node:crypto";
import { getPrisma } from "@/lib/db/prisma";

export type CustomerReturn = {
  id: string;
  orderId: string;
  orderNumber: string;
  reason: string;
  details: string | null;
  status: string;
  refundMinor: number;
  resolutionNote: string | null;
  createdAt: string;
  updatedAt: string;
};

type CustomerReturnRow = {
  id: string;
  orderId: string;
  orderNumber: string;
  reason: string;
  details: string | null;
  status: string;
  refundMinor: number;
  resolutionNote: string | null;
  createdAt: Date;
  updatedAt: Date;
};

function serialize(row: CustomerReturnRow): CustomerReturn {
  return {
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listReturnsForUser(userId: string) {
  const rows = await getPrisma().$queryRaw<CustomerReturnRow[]>`
    select
      r."id",
      r."orderId",
      o."orderNumber",
      r."reason",
      r."details",
      r."status",
      r."refundMinor",
      r."resolutionNote",
      r."createdAt",
      r."updatedAt"
    from "ReturnRequest" r
    join "Order" o on o."id"=r."orderId"
    where r."userId"=${userId}
    order by r."createdAt" desc
  `;

  return rows.map(serialize);
}

export async function createReturnForUser(
  userId: string,
  input: { orderNumber: string; reason: string; details?: string },
) {
  const prisma = getPrisma();
  const order = await prisma.order.findFirst({
    where: {
      orderNumber: input.orderNumber,
      userId,
      status: { in: ["SHIPPED", "DELIVERED"] },
    },
    select: { id: true, orderNumber: true },
  });

  if (!order) {
    throw new Error("This order is not eligible for a return.");
  }

  const existing = await prisma.$queryRaw<Array<{ id: string }>>`
    select "id"
    from "ReturnRequest"
    where "orderId"=${order.id} and "userId"=${userId}
    limit 1
  `;

  if (existing.length) {
    throw new Error("A return request already exists for this order.");
  }

  const id = randomUUID();
  await prisma.$executeRaw`
    insert into "ReturnRequest"(
      "id","orderId","userId","reason","details","createdAt","updatedAt"
    )
    values(
      ${id},
      ${order.id},
      ${userId},
      ${input.reason},
      ${input.details ?? null},
      now(),
      now()
    )
  `;

  await prisma.order.update({
    where: { id: order.id },
    data: { status: "RETURN_REQUESTED" },
  });

  return { id, orderNumber: order.orderNumber };
}
