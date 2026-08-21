import { getPrisma } from "@/lib/db/prisma";
export async function adjustStock(b:any){
  const id=String(b.inventoryId??""),delta=Number(b.delta),note=String(b.note??"").trim();
  if(!Number.isInteger(delta)||!delta||note.length<3)throw new Error("Adjustment and reason are required.");
  return getPrisma().$transaction(async tx=>{
    const r=await tx.inventoryItem.findUnique({where:{id}}); if(!r)throw new Error("Inventory row not found.");
    const next=r.onHand+delta; if(next<0||next<r.reserved)throw new Error("Cannot reduce stock below reserved quantity.");
    const u=await tx.inventoryItem.update({where:{id},data:{onHand:next}});
    await tx.inventoryMovement.create({data:{warehouseId:r.warehouseId,productId:r.productId,type:"ADJUSTMENT",quantity:delta,reference:`ADMIN:${id}`,note}});
    return u;
  });
}
