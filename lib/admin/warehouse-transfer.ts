import { randomUUID } from "node:crypto";
import { getPrisma } from "@/lib/db/prisma";
export async function transferStock(adminUserId:string,b:any){
  const from=String(b.fromWarehouseId),to=String(b.toWarehouseId),productId=String(b.productId),q=Number(b.quantity);
  if(from===to||!Number.isInteger(q)||q<=0)throw new Error("Invalid warehouse transfer.");
  return getPrisma().$transaction(async tx=>{
    const source=await tx.inventoryItem.findUnique({where:{productId_warehouseId:{productId,warehouseId:from}}});
    if(!source||source.onHand-source.reserved<q)throw new Error("Not enough available source stock.");
    let dest=await tx.inventoryItem.findUnique({where:{productId_warehouseId:{productId,warehouseId:to}}});
    if(!dest)dest=await tx.inventoryItem.create({data:{id:randomUUID(),productId,warehouseId:to,onHand:0,reserved:0,reorderLevel:5}});
    await tx.inventoryItem.update({where:{id:source.id},data:{onHand:{decrement:q}}});
    await tx.inventoryItem.update({where:{id:dest.id},data:{onHand:{increment:q}}});
    const id=randomUUID();
    await tx.$executeRaw`insert into "WarehouseTransfer"("id","fromWarehouseId","toWarehouseId","status","note","createdByUserId","createdAt")
      values(${id},${from},${to},"COMPLETED",${String(b.note||"")||null},${adminUserId},now())`;
    await tx.$executeRaw`insert into "WarehouseTransferItem"("id","transferId","productId","quantity") values(${randomUUID()},${id},${productId},${q})`;
    await tx.inventoryMovement.create({data:{warehouseId:from,productId,type:"TRANSFER",quantity:-q,reference:id,note:"Transfer outbound"}});
    await tx.inventoryMovement.create({data:{warehouseId:to,productId,type:"TRANSFER",quantity:q,reference:id,note:"Transfer inbound"}});
    return {id};
  });
}
