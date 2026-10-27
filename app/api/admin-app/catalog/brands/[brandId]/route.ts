import { adminFailure, adminJson, adminOptions, adminUnexpected, requireAdmin } from "@/lib/admin/admin-api";
import { archiveBrand, saveBrand } from "@/lib/admin/catalog-admin";
export const runtime = "nodejs";
export const OPTIONS = (request: Request) => adminOptions(request);
export async function PATCH(request: Request, context: { params: Promise<{ brandId: string }> }) { try { if (!await requireAdmin(request)) return adminFailure(request, "Admin authorization required.", 401); return adminJson(request, await saveBrand((await context.params).brandId, await request.json())); } catch (error) { return adminUnexpected(request, error); } }
export async function DELETE(request: Request, context: { params: Promise<{ brandId: string }> }) { try { if (!await requireAdmin(request)) return adminFailure(request, "Admin authorization required.", 401); return adminJson(request, await archiveBrand((await context.params).brandId)); } catch (error) { return adminUnexpected(request, error); } }