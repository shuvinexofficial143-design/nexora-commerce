import { adminFailure,adminJson,adminOptions,adminUnexpected,requireAdmin } from "@/lib/admin/admin-api";
import { logAdmin } from "@/lib/admin/audit";
import { ValidationError,ConflictError } from "@/lib/db/errors";
import { createAttributeDefinition,listAttributeDefinitions,setAttributeState } from "@/lib/admin/product-attributes";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export const OPTIONS=(r:Request)=>adminOptions(r);
export async function GET(r:Request){
  try{
    if(!await requireAdmin(r))return adminFailure(r,"Admin authorization required.",401);
    const id=new URL(r.url).searchParams.get("categoryId")??undefined;
    if(id&&(id.length>128||!/^[A-Za-z0-9_-]+$/.test(id)))
      return adminFailure(r,"Invalid category id.",400);
    return adminJson(r,await listAttributeDefinitions(id));
  }catch(e){return adminUnexpected(r,e);}
}
export async function POST(r:Request){
  try{
    const session=await requireAdmin(r);
    if(!session)return adminFailure(r,"Admin authorization required.",401);
    if(Number(r.headers.get("content-length")||0)>4096)return adminFailure(r,"Request too large.",413);
    const record=await createAttributeDefinition(await r.json().catch(()=>null));
    await logAdmin({adminUserId:session.user.id,action:"CATALOG_ATTRIBUTE_CREATE",
      entityType:"ATTRIBUTE",entityId:record.id,summary:"Created attribute "+record.slug});
    return adminJson(r,record,201);
  }catch(e){
    if(e instanceof ValidationError)return adminFailure(r,e.message,400);
    if(e instanceof ConflictError)return adminFailure(r,e.message,409);
    return adminUnexpected(r,e);
  }
}
export async function PATCH(r:Request){
  try{
    const session=await requireAdmin(r);
    if(!session)return adminFailure(r,"Admin authorization required.",401);
    if(Number(r.headers.get("content-length")||0)>2048)return adminFailure(r,"Request too large.",413);
    const record=await setAttributeState(await r.json().catch(()=>null));
    await logAdmin({adminUserId:session.user.id,action:"CATALOG_ATTRIBUTE_UPDATE",
      entityType:"ATTRIBUTE",entityId:record.id,summary:"Updated attribute visibility "+record.slug});
    return adminJson(r,record);
  }catch(e){
    if(e instanceof ValidationError)return adminFailure(r,e.message,400);
    return adminUnexpected(r,e);
  }
}