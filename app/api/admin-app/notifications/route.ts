import { getNotifications,readNotification } from "@/lib/admin/notifications";
import { adminFailure,adminJson,adminOptions,adminUnexpected,requireAdmin } from "@/lib/admin/admin-api";
export const runtime="nodejs"; export const OPTIONS=(r:Request)=>adminOptions(r);
export async function GET(r:Request){try{if(!await requireAdmin(r))return adminFailure(r,"Admin authorization required.",401);
 const a=await getNotifications();return adminJson(r,a.map(x=>({...x,createdAt:x.createdAt.toISOString(),readAt:x.readAt?.toISOString()??null})));
}catch(e){return adminUnexpected(r,e);}}
export async function PATCH(r:Request){try{if(!await requireAdmin(r))return adminFailure(r,"Admin authorization required.",401);
 const {id}=await r.json();await readNotification(String(id));return adminJson(r,{read:true});
}catch(e){return adminUnexpected(r,e);}}
