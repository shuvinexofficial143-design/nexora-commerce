import { adminFailure, adminJson, adminOptions, adminUnexpected, requireAdmin } from "@/lib/admin/admin-api";
import { listBrands, saveBrand } from "@/lib/admin/catalog-admin";
export const runtime = "nodejs";
export const OPTIONS = (request: Request) => adminOptions(request);
export async function GET(request: Request) { try { if (!await requireAdmin(request)) return adminFailure(request, "Admin authorization required.", 401); const url = new URL(request.url); return adminJson(request, await listBrands({ query: url.searchParams.get("q") ?? undefined, includeInactive: url.searchParams.get("inactive") === "true" })); } catch (error) { return adminUnexpected(request, error); } }
export async function POST(request: Request) { try { if (!await requireAdmin(request)) return adminFailure(request, "Admin authorization required.", 401); return adminJson(request, await saveBrand(undefined, await request.json()), 201); } catch (error) { return adminUnexpected(request, error); } }