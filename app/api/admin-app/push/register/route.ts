import { adminFailure,adminJson,adminOptions,adminUnexpected,requireAdmin } from "@/lib/admin/admin-api";
export const runtime="nodejs"; export const OPTIONS=(r:Request)=>adminOptions(r);

import { registerPush } from "@/lib/admin/push";
export async function POST(r:Request){try{const s=await requireAdmin(r);if(!s)return adminFailure(r,"Admin authorization required.",401);const b=await r.json();await registerPush(s.user.id,String(b.platform||"android"),String(b.token||""));return adminJson(r,{registered:true})}catch(e){return adminUnexpected(r,e)}}
