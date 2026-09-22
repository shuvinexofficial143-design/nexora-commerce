import { randomUUID } from "node:crypto";
import { getPrisma } from "@/lib/db/prisma";

type NotificationRow = Record<string, unknown>;
type NotificationIdRow = { id: string };

export async function notify(input: {
  type: string;
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
  severity?: string;
}) {
  const p = getPrisma();

  if (input.entityType && input.entityId) {
    const duplicate = await p.$queryRaw<NotificationIdRow[]>`
      select "id" from "AdminNotification"
      where "type"=${input.type}
        and "entityType"=${input.entityType}
        and "entityId"=${input.entityId}
        and "readAt" is null
      limit 1
    `;
    if (duplicate.length) return duplicate[0];
  }

  const id = randomUUID();
  await p.$executeRaw`
    insert into "AdminNotification"
      ("id","type","title","message","entityType","entityId","severity","createdAt")
    values (
      ${id},
      ${input.type},
      ${input.title},
      ${input.message},
      ${input.entityType ?? null},
      ${input.entityId ?? null},
      ${input.severity ?? "INFO"},
      now()
    )
  `;

  return { id };
}

export async function syncAlerts() {
  const p = getPrisma();
  const stock = await p.inventoryItem.findMany({ include: { product: true, warehouse: true } });

  for (const row of stock) {
    const available = Math.max(0, row.onHand - row.reserved);
    if (available <= row.reorderLevel) {
      await notify({
        type: "LOW_STOCK",
        title: available ? "Low stock" : "Out of stock",
        message: `${row.product.name}: ${available} available at ${row.warehouse.name}`,
        entityType: "PRODUCT",
        entityId: row.productId,
        severity: available ? "WARNING" : "CRITICAL",
      });
    }
  }

  const orders = await p.order.findMany({
    where: {
      status: "PENDING",
      createdAt: { gte: new Date(Date.now() - 86400000) },
    },
    select: { id: true, orderNumber: true },
  });

  for (const order of orders) {
    await notify({
      type: "NEW_ORDER",
      title: "New order",
      message: `${order.orderNumber} needs attention`,
      entityType: "ORDER",
      entityId: order.id,
    });
  }
}

export async function getNotifications() {
  await syncAlerts();
  return getPrisma().$queryRaw<NotificationRow[]>`
    select * from "AdminNotification"
    order by ("readAt" is null) desc,"createdAt" desc
    limit 100
  `;
}

export async function readNotification(id: string) {
  await getPrisma().$executeRaw`
    update "AdminNotification"
    set "readAt"=coalesce("readAt",now())
    where "id"=${id}
  `;
}
