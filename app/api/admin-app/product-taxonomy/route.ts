import { createProductTaxonomy, listProductTaxonomy } from "@/lib/admin/product-taxonomy";
import { ConflictError, ValidationError } from "@/lib/db/errors";
import { logAdmin } from "@/lib/admin/audit";
import { adminFailure, adminJson, adminOptions, adminUnexpected, requireAdmin } from "@/lib/admin/admin-api";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const OPTIONS = (request: Request) => adminOptions(request);
export async function GET(request: Request) {
  try {
    if (!await requireAdmin(request)) return adminFailure(request,"Admin authorization required.",401);
    return adminJson(request,await listProductTaxonomy());
  } catch (error) { return adminUnexpected(request,error); }
}
export async function POST(request: Request) {
  try {
    const session = await requireAdmin(request);
    if (!session) return adminFailure(request,"Admin authorization required.",401);
    if (Number(request.headers.get("content-length")||0)>4096)
      return adminFailure(request,"Catalog request is too large.",413);
    const created = await createProductTaxonomy(await request.json().catch(()=>null));
    await logAdmin({ adminUserId:session.user.id,
      action:"CATALOG_OPTION_CREATE", entityType:created.kind.toUpperCase(), entityId:created.id,
      summary:"Created catalog "+created.kind+" "+created.slug });
    return adminJson(request,created,201);
  } catch (error) {
    if (error instanceof ValidationError) return adminFailure(request,error.message,400);
    if (error instanceof ConflictError) return adminFailure(request,error.message,409);
    return adminUnexpected(request,error);
  }
}
