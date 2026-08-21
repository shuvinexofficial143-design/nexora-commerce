import { adminFailure,adminJson,adminOptions,adminUnexpected,requireAdmin } from "@/lib/admin/admin-api";
export const runtime="nodejs"; export const OPTIONS=(r:Request)=>adminOptions(r);

import { listSellers,updateSeller } from "@/lib/admin/sellers";
export async function GET(r:Request){try{if(!await requireAdmin(r))return adminFailure(r,"Admin authorization required.",401);return adminJson(r,await listSellers())}catch(e){return adminUnexpected(r,e)}}
export async function PATCH(r:Request){try{if(!await requireAdmin(r))return adminFailure(r,"Admin authorization required.",401);const b=await r.json();await updateSeller(String(b.id),b);return adminJson(r,{updated:true})}catch(e){return adminUnexpected(r,e)}}
