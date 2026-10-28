import { adminFailure, adminJson, adminOptions, adminUnexpected, requireAdmin } from "@/lib/admin/admin-api";
import { logAdmin } from "@/lib/admin/audit";
import { updateHomepageBanner } from "@/lib/home-banners";
import { NotFoundError, ValidationError } from "@/lib/db/errors";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export const OPTIONS = (request:Request)=>adminOptions(request);
export async function PATCH(request:Request, context:{params:Promise<{bannerId:string}>}) {
  try {
    const owner=await requireAdmin(request);
    if (!owner) return adminFailure(request,"Admin authorization required.",401);
    if (Number(request.headers.get("content-length")||0)>8192)
      return adminFailure(request,"Banner request too large.",413);
    const {bannerId}=await context.params;
    const result=await updateHomepageBanner(bannerId,await request.json().catch(()=>null));
    await logAdmin({adminUserId:owner.user.id,action:result.archived?"HOMEPAGE_BANNER_ARCHIVE":"HOMEPAGE_BANNER_UPDATE",
      entityType:"HOMEPAGE_BANNER",entityId:result.id,summary:"Updated banner "+result.id});
    return adminJson(request,result);
  } catch(error) {
    if(error instanceof NotFoundError)return adminFailure(request,error.message,404);
    if(error instanceof ValidationError)return adminFailure(request,error.message,400);
    return adminUnexpected(request,error);
  }
}