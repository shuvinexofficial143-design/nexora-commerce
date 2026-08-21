import { getAdminActivity } from "@/lib/admin/audit";
import { adminFailure,adminJson,adminOptions,adminUnexpected,requireAdmin } from "@/lib/admin/admin-api";
export const runtime="nodejs"; export const OPTIONS=(r:Request)=>adminOptions(r);
export async function GET(r:Request){try{if(!await requireAdmin(r))return adminFailure(r,"Admin authorization required.",401);
 const a=await getAdminActivity();return adminJson(r,a.map(x=>({...x,createdAt:x.createdAt.toISOString()})));
}catch(e){return adminUnexpected(r,e);}}
