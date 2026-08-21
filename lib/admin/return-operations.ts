import { getPrisma } from "@/lib/db/prisma";
export async function processReturn(input:{returnId:string;status:string;refundMinor:number;note:string;restock:boolean}){
  const p=getPrisma();
  return p.$transaction(async tx=>{
    const rows=await tx.$queryRaw<any[]>`select r.*,o."orderNumber" from "ReturnRequest" r join "Order" o on o."id"=r."orderId" where r."id"=${input.returnId} limit 1`;
    const r=rows[0]; if(!r)throw new Error("Return not found.");
    if(input.restock&&!r.restockedAt){
      const items=await tx.orderItem.findMany({where:{orderId:r.orderId}});
      for(const item of items){
        const stock=await tx.inventoryItem.findFirst({where:{productId:item.productId},orderBy:{onHand:"desc"}});
        if(!stock)continue;
        await tx.inventoryItem.update({where:{id:stock.id},data:{onHand:{increment:item.quantity}}});
        await tx.inventoryMovement.create({data:{warehouseId:stock.warehouseId,productId:item.productId,type:"INBOUND",quantity:item.quantity,reference:r.orderNumber,note:`RETURN_RESTOCK:${r.id}`}});
      }
      await tx.$executeRaw`update "ReturnRequest" set "restockedAt"=now() where "id"=${r.id}`;
    }
    if(input.refundMinor>0&&!r.refundProcessedAt){
      await tx.order.update({where:{id:r.orderId},data:{paymentStatus:"REFUNDED",status:"REFUNDED"}});
      await tx.$executeRaw`update "ReturnRequest" set "refundProcessedAt"=now() where "id"=${r.id}`;
    }
    await tx.$executeRaw`update "ReturnRequest" set "status"=${input.status},"refundMinor"=${input.refundMinor},"resolutionNote"=${input.note},"updatedAt"=now() where "id"=${r.id}`;
    return {updated:true};
  });
}
