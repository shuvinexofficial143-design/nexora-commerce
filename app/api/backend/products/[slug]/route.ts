import { getProductBySlug } from "@/lib/db/products";
import { NotFoundError } from "@/lib/db/errors";
import { apiError, ok } from "@/lib/server/backend";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await context.params;
    const product = await getProductBySlug(slug);
    if (!product) throw new NotFoundError("Product not found.");
    return ok(product);
  } catch (error) {
    return apiError(error);
  }
}
