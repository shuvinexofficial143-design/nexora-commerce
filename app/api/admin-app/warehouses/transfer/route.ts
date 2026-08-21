import { transferStock } from "@/lib/admin/warehouse-transfer";
import { logAdmin } from "@/lib/admin/audit";
import { adminFailure,adminJson,adminOptions,adminUnexpected,requireAdmin } from "@/lib/admin/admin-api";
export const runtime="nodejs"; export const OPTIONS=(r:Request)=>adminOptions(r);
export async function POST(r:Request){
  try{const s=await requireAdmin(r);if(!s)return adminFailure(r,"Admin authorization required.",401);
    const x=await transferStock(s.user.id,await r.json());
    await logAdmin({adminUserId:s.user.id,action:"WAREHOUSE_TRANSFER",entityType:"TRANSFER",entityId:x.id,summary:`Warehouse transfer ${x.id}`});
    return adminJson(r,x,201);
  }catch(e){return adminUnexpected(r,e)}
}
