import { adminFailure, adminJson, adminOptions, adminUnexpected, requireAdmin } from "@/lib/admin/admin-api";
import { applyBulkProductAction, BulkProductConflict } from "@/lib/admin/product-bulk";
import { ValidationError } from "@/lib/db/errors";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export const OPTIONS=(r:Request)=>adminOptions(r);
export async function POST(request:Request){
  try{
    const session=await requireAdmin(request);
    if(!session)return adminFailure(request,"Admin authorization required.",401);
    if(Number(request.headers.get("content-length")||0)>12000)
      return adminFailure(request,"Bulk product request is too large.",413);
    const raw=await request.json().catch(()=>null);
    const result=await applyBulkProductAction(raw,session.user.id);
    return adminJson(request,result);
  }catch(error){
    if(error instanceof BulkProductConflict)
      return adminFailure(request,error.message,409);
    if(error instanceof ValidationError)
      return adminFailure(request,error.message,400);
    return adminUnexpected(request,error);
  }
}