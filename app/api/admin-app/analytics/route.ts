import { adminFailure,adminJson,adminOptions,adminUnexpected,requireAdmin } from "@/lib/admin/admin-api";
export const runtime="nodejs"; export const OPTIONS=(r:Request)=>adminOptions(r);

import { getAnalytics } from "@/lib/admin/analytics";
export async function GET(r:Request){try{if(!await requireAdmin(r))return adminFailure(r,"Admin authorization required.",401);return adminJson(r,await getAnalytics())}catch(e){return adminUnexpected(r,e)}}
