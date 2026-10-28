import { adminFailure,adminJson,adminOptions,adminUnexpected,requireAdmin } from "@/lib/admin/admin-api";
import { logAdmin } from "@/lib/admin/audit";
import { BannerReorderConflict,reorderHomepageBanners } from "@/lib/admin/banner-order";
import { ValidationError } from "@/lib/db/errors";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export const OPTIONS=(request:Request)=>adminOptions(request);
export async function POST(request:Request){
  try{
    const owner=await requireAdmin(request);
    if(!owner)return adminFailure(request,"Admin authorization required.",401);
    if(Number(request.headers.get("content-length")||0)>16000)
      return adminFailure(request,"Banner reorder request is too large.",413);
    const result=await reorderHomepageBanners(await request.json().catch(()=>null));
    await logAdmin({adminUserId:owner.user.id,action:"HOMEPAGE_BANNER_REORDER",
      entityType:"HOMEPAGE_BANNER",entityId:"homepage",summary:"Reordered "+result.reordered+" banners"});
    return adminJson(request,result);
  }catch(error){
    if(error instanceof BannerReorderConflict)return adminFailure(request,error.message,409);
    if(error instanceof ValidationError)return adminFailure(request,error.message,400);
    return adminUnexpected(request,error);
  }
}