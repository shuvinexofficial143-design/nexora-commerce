import { getPrisma } from "@/lib/db/prisma";
export async function getAnalytics(){
 const p=getPrisma(),from=new Date(Date.now()-30*86400000);
 const orders=await p.order.findMany({where:{createdAt:{gte:from}},select:{createdAt:true,totalMinor:true,status:true,paymentMethod:true,userId:true}});
 const days=new Map<string,number>(); for(const o of orders){const k=o.createdAt.toISOString().slice(0,10);days.set(k,(days.get(k)||0)+o.totalMinor)}
 return {revenueMinor:orders.reduce((s,o)=>s+o.totalMinor,0),orders:orders.length,customers:new Set(orders.map(o=>o.userId)).size,
 byDay:[...days].map(([date,revenueMinor])=>({date,revenueMinor})),paymentMix:Object.entries(orders.reduce((a:any,o)=>(a[o.paymentMethod||"unknown"]=(a[o.paymentMethod||"unknown"]||0)+1,a),{})).map(([method,count])=>({method,count}))};
}
