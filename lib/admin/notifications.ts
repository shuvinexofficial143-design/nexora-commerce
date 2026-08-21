import { randomUUID } from "node:crypto";
import { getPrisma } from "@/lib/db/prisma";

export async function notify(input:{type:string;title:string;message:string;entityType?:string;entityId?:string;severity?:string}){
  const p=getPrisma();
  if(input.entityType&&input.entityId){
    const dup=await p.$queryRaw<any[]>`select "id" from "AdminNotification"
      where "type"=${input.type} and "entityType"=${input.entityType} and "entityId"=${input.entityId} and "readAt" is null limit 1`;
    if(dup.length)return dup[0];
  }
  const id=randomUUID();
  await p.$executeRaw`insert into "AdminNotification"
    ("id","type","title","message","entityType","entityId","severity","createdAt")
    values (${id},${input.type},${input.title},${input.message},${input.entityType??null},${input.entityId??null},${input.severity??"INFO"},now())`;
  return {id};
}
export async function syncAlerts(){
  const p=getPrisma();
  const stock=await p.inventoryItem.findMany({include:{product:true,warehouse:true}});
  for(const r of stock){
    const a=Math.max(0,r.onHand-r.reserved);
    if(a<=r.reorderLevel)await notify({type:"LOW_STOCK",title:a?"Low stock":"Out of stock",
      message:`${r.product.name}: ${a} available at ${r.warehouse.name}`,entityType:"PRODUCT",entityId:r.productId,severity:a?"WARNING":"CRITICAL"});
  }
  const orders=await p.order.findMany({where:{status:"PENDING",createdAt:{gte:new Date(Date.now()-86400000)}},select:{id:true,orderNumber:true}});
  for(const o of orders)await notify({type:"NEW_ORDER",title:"New order",message:`${o.orderNumber} needs attention`,entityType:"ORDER",entityId:o.id});
}
export async function getNotifications(){
  await syncAlerts();
  return getPrisma().$queryRaw<any[]>`select * from "AdminNotification" order by ("readAt" is null) desc,"createdAt" desc limit 100`;
}
export async function readNotification(id:string){
  await getPrisma().$executeRaw`update "AdminNotification" set "readAt"=coalesce("readAt",now()) where "id"=${id}`;
}
