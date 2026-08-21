import { adminFailure,adminJson,adminOptions,adminUnexpected,requireAdmin } from "@/lib/admin/admin-api";
export const runtime="nodejs"; export const OPTIONS=(r:Request)=>adminOptions(r);

import { listWarehouses,createWarehouse,toggleWarehouse } from "@/lib/admin/warehouses";
export async function GET(r:Request){try{if(!await requireAdmin(r))return adminFailure(r,"Admin authorization required.",401);return adminJson(r,await listWarehouses())}catch(e){return adminUnexpected(r,e)}}
export async function POST(r:Request){try{if(!await requireAdmin(r))return adminFailure(r,"Admin authorization required.",401);return adminJson(r,await createWarehouse(await r.json()),201)}catch(e){return adminUnexpected(r,e)}}
export async function PATCH(r:Request){try{if(!await requireAdmin(r))return adminFailure(r,"Admin authorization required.",401);const b=await r.json();return adminJson(r,await toggleWarehouse(String(b.id),Boolean(b.active)))}catch(e){return adminUnexpected(r,e)}}
