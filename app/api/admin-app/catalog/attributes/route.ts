import { adminFailure, adminJson, adminOptions, adminUnexpected, requireAdmin } from "@/lib/admin/admin-api";
import { listAttributeDefinitions, saveAttributeDefinition } from "@/lib/admin/catalog-admin";
export const runtime = "nodejs";
export const OPTIONS = (request: Request) => adminOptions(request);
export async function GET(request: Request) { try { if (!await requireAdmin(request)) return adminFailure(request, "Admin authorization required.", 401); return adminJson(request, await listAttributeDefinitions(new URL(request.url).searchParams.get("categoryId") ?? undefined)); } catch (error) { return adminUnexpected(request, error); } }
export async function POST(request: Request) { try { if (!await requireAdmin(request)) return adminFailure(request, "Admin authorization required.", 401); return adminJson(request, await saveAttributeDefinition(undefined, await request.json()), 201); } catch (error) { return adminUnexpected(request, error); } }