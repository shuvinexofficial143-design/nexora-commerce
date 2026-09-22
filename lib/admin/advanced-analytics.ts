import { getPrisma } from "@/lib/db/prisma";

type ReturnRow = Record<string, unknown>;

export async function advancedAnalytics() {
  const p = getPrisma();
  const from = new Date(Date.now() - 30 * 86400000);

  const [orders, products, returns] = await Promise.all([
    p.order.findMany({ where: { createdAt: { gte: from } }, include: { items: true } }),
    p.product.findMany({ include: { inventory: true } }),
    p.$queryRaw<ReturnRow[]>`select * from "ReturnRequest" where "createdAt">=${from}`,
  ]);

  const sales = new Map<string, { name: string; qty: number; revenue: number }>();
  for (const order of orders) {
    for (const item of order.items) {
      const current = sales.get(item.productId) ?? { name: item.productName, qty: 0, revenue: 0 };
      current.qty += item.quantity;
      current.revenue += item.totalMinor;
      sales.set(item.productId, current);
    }
  }

  const gross = orders.reduce((sum, order) => sum + order.totalMinor, 0);

  return {
    grossRevenueMinor: gross,
    avgOrderMinor: orders.length ? Math.round(gross / orders.length) : 0,
    returnRate: orders.length ? returns.length / orders.length : 0,
    topProducts: [...sales.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 8),
    lowStockProducts: products
      .filter((product) =>
        product.inventory.reduce(
          (sum, item) => sum + Math.max(0, item.onHand - item.reserved),
          0,
        ) <= 5,
      )
      .map((product) => product.name)
      .slice(0, 10),
  };
}
