import { updateProduct } from "@/lib/admin/product-admin";
import { logAdmin } from "@/lib/admin/audit";
import { adminFailure,adminJson,adminOptions,adminUnexpected,requireAdmin } from "@/lib/admin/admin-api";
export const runtime="nodejs"; export const OPTIONS=(r:Request)=>adminOptions(r);
export async function PATCH(r:Request,c:{params:Promise<{productId:string}>}){try{const s=await requireAdmin(r);if(!s)return adminFailure(r,"Admin authorization required.",401);
 const {productId}=await c.params,b=await r.json(),p=await updateProduct(productId,b);await logAdmin({adminUserId:s.user.id,action:"PRODUCT_UPDATE",entityType:"PRODUCT",entityId:p.id,summary:`Updated ${p.name}`});return adminJson(r,p);
}catch(e){return adminUnexpected(r,e);}}
