import { ValidationError } from "@/lib/db/errors";
import { createProduct } from "@/lib/admin/product-admin";
import { adminFailure,adminJson,adminOptions,adminUnexpected,requireAdmin } from "@/lib/admin/admin-api";
export const runtime="nodejs"; export const OPTIONS=(r:Request)=>adminOptions(r);
export async function POST(r:Request){try{const s=await requireAdmin(r);if(!s)return adminFailure(r,"Admin authorization required.",401);
 const p=await createProduct(await r.json(),s.user.id);return adminJson(r,p,201);
}catch(e){if(e instanceof ValidationError)return adminFailure(r,e.message,400);return adminUnexpected(r,e);}}
