import { adminFailure,adminJson,adminOptions,adminUnexpected,requireAdmin } from "@/lib/admin/admin-api";
export const runtime="nodejs"; export const OPTIONS=(r:Request)=>adminOptions(r);

import { listCoupons,createCoupon,toggleCoupon } from "@/lib/admin/coupons";
export async function GET(r:Request){try{if(!await requireAdmin(r))return adminFailure(r,"Admin authorization required.",401);return adminJson(r,await listCoupons())}catch(e){return adminUnexpected(r,e)}}
export async function POST(r:Request){try{if(!await requireAdmin(r))return adminFailure(r,"Admin authorization required.",401);return adminJson(r,await createCoupon(await r.json()),201)}catch(e){return adminUnexpected(r,e)}}
export async function PATCH(r:Request){try{if(!await requireAdmin(r))return adminFailure(r,"Admin authorization required.",401);const b=await r.json();await toggleCoupon(String(b.id),Boolean(b.active));return adminJson(r,{updated:true})}catch(e){return adminUnexpected(r,e)}}
