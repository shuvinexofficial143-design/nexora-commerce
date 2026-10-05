import { getPrisma } from "@/lib/db/prisma";
import { reconcileOrder } from "@/lib/admin/stock";
import { logAdmin } from "@/lib/admin/audit";
import { notify } from "@/lib/admin/notifications";
import { adminFailure,adminJson,adminOptions,adminUnexpected,requireAdmin } from "@/lib/admin/admin-api";
import { sendOrderStatusEmail, tryCustomerEmail } from "@/lib/notifications/customer-email";
export const runtime="nodejs";
export const OPTIONS=(r:Request)=>adminOptions(r);
export async function PATCH(r:Request,c:{params:Promise<{orderId:string}>}){
 try{
  const s=await requireAdmin(r); if(!s)return adminFailure(r,"Admin authorization required.",401);
  const {orderId}=await c.params,b=await r.json(),status=String(b.status??"");
  const allowed=["PENDING","CONFIRMED","PROCESSING","PACKED","SHIPPED","OUT_FOR_DELIVERY","DELIVERED","CANCELLED"];
  if(!allowed.includes(status))return adminFailure(r,"Invalid order status.",400);
  const p=getPrisma(),o=await p.order.findFirst({where:{OR:[{id:orderId},{orderNumber:orderId}]},include:{items:{select:{productId:true,quantity:true}},user:{select:{name:true,email:true}}}});
  if(!o)return adminFailure(r,"Order not found.",404);
  if(o.status==="DELIVERED"&&status!=="DELIVERED")return adminFailure(r,"Delivered order cannot move backwards.",409);
  if(o.status==="CANCELLED"&&status!=="CANCELLED")return adminFailure(r,"Cancelled order cannot move backwards.",409);
  const u=await p.$transaction(async tx=>{if(status==="DELIVERED")await reconcileOrder(tx,o,"DELIVER");if(status==="CANCELLED")await reconcileOrder(tx,o,"CANCEL");
    return tx.order.update({where:{id:o.id},data:{status:status as never},select:{id:true,orderNumber:true,status:true,updatedAt:true}});});
  await logAdmin({adminUserId:s.user.id,action:"ORDER_STATUS_UPDATE",entityType:"ORDER",entityId:o.id,summary:`${o.orderNumber}: ${o.status} → ${status}`});
  if(["DELIVERED","CANCELLED"].includes(status))await notify({type:`ORDER_${status}`,title:`Order ${status.toLowerCase()}`,message:`${o.orderNumber} inventory reconciled`,entityType:"ORDER",entityId:o.id,severity:status==="DELIVERED"?"SUCCESS":"WARNING"});

  if(status!==o.status){
    await tryCustomerEmail(
      () => sendOrderStatusEmail({
        to:o.user.email,
        customerName:o.user.name,
        orderNumber:o.orderNumber,
        status,
      }),
      `order-status:${o.orderNumber}:${status}`,
    );
  }

  return adminJson(r,{...u,updatedAt:u.updatedAt.toISOString()});
 }catch(e){return adminUnexpected(r,e);}
}
