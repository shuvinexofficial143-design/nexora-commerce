import { getPrisma } from "@/lib/db/prisma";
export async function advancedAnalytics(){
  const p=getPrisma(),from=new Date(Date.now()-30*86400000);
  const [orders,products,returns]=await Promise.all([
    p.order.findMany({where:{createdAt:{gte:from}},include:{items:true}}),
    p.product.findMany({include:{inventory:true}}),
    p.$queryRaw<any[]>`select * from "ReturnRequest" where "createdAt">=${from}`
  ]);
  const sales=new Map<string,{name:string,qty:number,revenue:number}>();
  for(const o of orders)for(const i of o.items){const x=sales.get(i.productId)||{name:i.productName,qty:0,revenue:0};x.qty+=i.quantity;x.revenue+=i.totalMinor;sales.set(i.productId,x)}
  const gross=orders.reduce((s,o)=>s+o.totalMinor,0);
  return {grossRevenueMinor:gross,avgOrderMinor:orders.length?Math.round(gross/orders.length):0,returnRate:orders.length?returns.length/orders.length:0,
    topProducts:[...sales.values()].sort((a,b)=>b.revenue-a.revenue).slice(0,8),
    lowStockProducts:products.filter(p=>p.inventory.reduce((s,i)=>s+Math.max(0,i.onHand-i.reserved),0)<=5).map(p=>p.name).slice(0,10)};
}
