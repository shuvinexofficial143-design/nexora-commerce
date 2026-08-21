import { adjustStock } from "@/lib/admin/inventory-admin";
import { logAdmin } from "@/lib/admin/audit";
import { adminFailure,adminJson,adminOptions,adminUnexpected,requireAdmin } from "@/lib/admin/admin-api";
export const runtime="nodejs"; export const OPTIONS=(r:Request)=>adminOptions(r);
export async function POST(r:Request){try{const s=await requireAdmin(r);if(!s)return adminFailure(r,"Admin authorization required.",401);
 const b=await r.json(),u=await adjustStock(b);await logAdmin({adminUserId:s.user.id,action:"INVENTORY_ADJUSTMENT",entityType:"INVENTORY",entityId:u.id,summary:`Inventory adjusted by ${Number(b.delta)}`,metadata:{note:b.note}});return adminJson(r,u);
}catch(e){return adminUnexpected(r,e);}}
