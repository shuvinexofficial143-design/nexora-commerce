import { adminFailure,adminJson,adminOptions,adminUnexpected,requireAdmin } from "@/lib/admin/admin-api";
export const runtime="nodejs"; export const OPTIONS=(r:Request)=>adminOptions(r);

import { resolveReturn } from "@/lib/admin/returns"; import { logAdmin } from "@/lib/admin/audit";
export async function PATCH(r:Request,c:{params:Promise<{returnId:string}>}){try{const s=await requireAdmin(r);if(!s)return adminFailure(r,"Admin authorization required.",401);
 const {returnId}=await c.params,b=await r.json();await resolveReturn(returnId,String(b.status),Math.round(Number(b.refund||0)*100),String(b.note||""));
 await logAdmin({adminUserId:s.user.id,action:"RETURN_RESOLVE",entityType:"RETURN",entityId:returnId,summary:`Return ${returnId} → ${b.status}`});return adminJson(r,{updated:true})}catch(e){return adminUnexpected(r,e)}}
