import { getPrisma } from "@/lib/db/prisma";

export async function getAnalytics() {
  const p = getPrisma();
  const from = new Date(Date.now() - 30 * 86400000);
  const orders = await p.order.findMany({
    where: { createdAt: { gte: from } },
    select: {
      createdAt: true,
      totalMinor: true,
      status: true,
      paymentMethod: true,
      userId: true,
    },
  });

  const days = new Map<string, number>();
  const paymentCounts: Record<string, number> = {};

  for (const order of orders) {
    const day = order.createdAt.toISOString().slice(0, 10);
    days.set(day, (days.get(day) ?? 0) + order.totalMinor);

    const method = order.paymentMethod || "unknown";
    paymentCounts[method] = (paymentCounts[method] ?? 0) + 1;
  }

  return {
    revenueMinor: orders.reduce((sum, order) => sum + order.totalMinor, 0),
    orders: orders.length,
    customers: new Set(orders.map((order) => order.userId)).size,
    byDay: [...days].map(([date, revenueMinor]) => ({ date, revenueMinor })),
    paymentMix: Object.entries(paymentCounts).map(([method, count]) => ({ method, count })),
  };
}
