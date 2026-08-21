export async function reconcileOrder(tx:any,order:any,mode:"DELIVER"|"CANCEL"){
  const already=await tx.inventoryMovement.findFirst({where:{reference:order.orderNumber,note:{startsWith:"ORDER_SETTLED:"}}});
  if(already)return;
  const reserves=await tx.inventoryMovement.findMany({where:{reference:order.orderNumber,type:"RESERVE"},orderBy:{createdAt:"asc"}});
  for(const item of order.items){
    let left=item.quantity;
    for(const m of reserves.filter((x:any)=>x.productId===item.productId)){
      if(left<=0)break;
      const q=Math.min(left,m.quantity);
      const row=await tx.inventoryItem.findUnique({where:{productId_warehouseId:{productId:item.productId,warehouseId:m.warehouseId}}});
      if(!row||row.reserved<q||(mode==="DELIVER"&&row.onHand<q))throw new Error("Inventory reservation mismatch.");
      await tx.inventoryItem.update({where:{id:row.id},data:mode==="DELIVER"
        ?{reserved:{decrement:q},onHand:{decrement:q}}:{reserved:{decrement:q}}});
      await tx.inventoryMovement.create({data:{warehouseId:m.warehouseId,productId:item.productId,
        type:mode==="DELIVER"?"OUTBOUND":"RELEASE",quantity:q,reference:order.orderNumber,note:`ORDER_SETTLED:${mode}:${m.id}`}});
      left-=q;
    }
    if(left>0)throw new Error("Reserved stock could not be fully reconciled.");
  }
}
