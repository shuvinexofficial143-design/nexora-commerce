import { resolveProductsBySlugs } from "@/lib/db/product-resolution";
import { apiError, ok } from "@/lib/server/backend";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    return ok(await resolveProductsBySlugs(await request.json()));
  } catch (error) {
    return apiError(error);
  }
}
