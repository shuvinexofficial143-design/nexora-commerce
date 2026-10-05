import { processReturn } from "@/lib/admin/return-operations";
import { logAdmin } from "@/lib/admin/audit";
import { adminFailure,adminJson,adminOptions,adminUnexpected,requireAdmin } from "@/lib/admin/admin-api";
import { sendReturnStatusEmail, tryCustomerEmail } from "@/lib/notifications/customer-email";
export const runtime="nodejs"; export const OPTIONS=(r:Request)=>adminOptions(r);
export async function POST(r:Request,c:{params:Promise<{returnId:string}>}){
  try{const s=await requireAdmin(r);if(!s)return adminFailure(r,"Admin authorization required.",401);
    const{returnId}=await c.params,b=await r.json();
    const out=await processReturn({returnId,status:String(b.status||"APPROVED"),refundMinor:Math.round(Number(b.refund||0)*100),note:String(b.note||""),restock:Boolean(b.restock)});
    await logAdmin({adminUserId:s.user.id,action:"RETURN_PROCESS",entityType:"RETURN",entityId:returnId,summary:`Processed return ${returnId}`});

    await tryCustomerEmail(
      () => sendReturnStatusEmail({
        to:out.customerEmail,
        customerName:out.customerName,
        orderNumber:out.orderNumber,
        status:String(b.status||"APPROVED"),
        refundMinor:Math.round(Number(b.refund||0)*100),
        note:String(b.note||""),
      }),
      `return-status:${returnId}`,
    );

    return adminJson(r,out);
  }catch(e){return adminUnexpected(r,e)}
}
