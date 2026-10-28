import { adminFailure, adminJson, adminOptions, adminUnexpected, requireAdmin } from "@/lib/admin/admin-api";
import { logAdmin } from "@/lib/admin/audit";
import { createHomepageBanner, listAdminHomepageBanners } from "@/lib/home-banners";
import { ValidationError } from "@/lib/db/errors";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export const OPTIONS = (request:Request)=>adminOptions(request);
export async function GET(request:Request) {
  try {
    if (!await requireAdmin(request)) return adminFailure(request,"Admin authorization required.",401);
    return adminJson(request,await listAdminHomepageBanners());
  } catch(error){return adminUnexpected(request,error);}
}
export async function POST(request:Request) {
  try {
    const owner=await requireAdmin(request);
    if (!owner) return adminFailure(request,"Admin authorization required.",401);
    if (Number(request.headers.get("content-length")||0)>8192)
      return adminFailure(request,"Banner request too large.",413);
    const created=await createHomepageBanner(await request.json().catch(()=>null));
    await logAdmin({adminUserId:owner.user.id,action:"HOMEPAGE_BANNER_CREATE",
      entityType:"HOMEPAGE_BANNER",entityId:created.id,summary:"Created banner "+created.id});
    return adminJson(request,created,201);
  } catch(error) {
    if(error instanceof ValidationError) return adminFailure(request,error.message,400);
    return adminUnexpected(request,error);
  }
}