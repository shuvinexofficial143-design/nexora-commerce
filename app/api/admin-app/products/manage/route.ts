import { createProduct } from "@/lib/admin/product-admin";
import { logAdmin } from "@/lib/admin/audit";
import { adminFailure,adminJson,adminOptions,adminUnexpected,requireAdmin } from "@/lib/admin/admin-api";
export const runtime="nodejs"; export const OPTIONS=(r:Request)=>adminOptions(r);
export async function POST(r:Request){try{const s=await requireAdmin(r);if(!s)return adminFailure(r,"Admin authorization required.",401);
 const p=await createProduct(await r.json());await logAdmin({adminUserId:s.user.id,action:"PRODUCT_CREATE",entityType:"PRODUCT",entityId:p.id,summary:`Created ${p.name}`});return adminJson(r,p,201);
}catch(e){return adminUnexpected(r,e);}}
