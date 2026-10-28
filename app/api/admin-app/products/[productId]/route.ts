import { updateProduct } from "@/lib/admin/product-admin";
import { ProductPublishValidationError } from "@/lib/admin/product-publish";
import { adminFailure,adminJson,adminOptions,adminUnexpected,requireAdmin } from "@/lib/admin/admin-api";
export const runtime="nodejs"; export const OPTIONS=(r:Request)=>adminOptions(r);
export async function PATCH(r:Request,c:{params:Promise<{productId:string}>}){try{const s=await requireAdmin(r);if(!s)return adminFailure(r,"Admin authorization required.",401);
 const {productId}=await c.params,b=await r.json(),p=await updateProduct(productId,b,s.user.id);return adminJson(r,p);
}catch(e){if(e instanceof ProductPublishValidationError)return adminFailure(r,e.message,400);return adminUnexpected(r,e);}}
