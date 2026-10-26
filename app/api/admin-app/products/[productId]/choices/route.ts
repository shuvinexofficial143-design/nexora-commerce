import { getPrisma } from "@/lib/db/prisma";
import { deserializeProductChoiceGroups, parseProductChoiceGroups } from "@/lib/commerce/product-choices";
import { ValidationError } from "@/lib/db/errors";
import { adminFailure, adminJson, adminOptions, adminUnexpected, requireAdmin } from "@/lib/admin/admin-api";

export const runtime = "nodejs";
export function OPTIONS(request: Request) { return adminOptions(request); }

type Context = { params: Promise<{ productId: string }> };
export async function GET(request: Request, context: Context) {
  try {
    if (!await requireAdmin(request)) return adminFailure(request, "Admin authorization required.", 401);
    const { productId } = await context.params;
    const product = await getPrisma().product.findUnique({
      where: { id: productId },
      select: { id: true, choiceGroups: { orderBy: { sortOrder: "asc" } } },
    });
    if (!product) return adminFailure(request, "Product not found.", 404);
    return adminJson(request, deserializeProductChoiceGroups(product.choiceGroups));
  } catch (error) { return adminUnexpected(request, error); }
}

export async function PUT(request: Request, context: Context) {
  try {
    if (!await requireAdmin(request)) return adminFailure(request, "Admin authorization required.", 401);
    const { productId } = await context.params;
    if (Number(request.headers.get("content-length") || 0) > 32000) {
      return adminFailure(request, "Options request too large.", 413);
    }
    const payload = await request.json().catch(() => null);
    const groups = parseProductChoiceGroups((payload as { groups?: unknown } | null)?.groups);
    const prisma = getPrisma();
    const result = await prisma.$transaction(async tx => {
      const found = await tx.product.findUnique({ where: { id: productId }, select: { id: true } });
      if (!found) return null;
      await tx.productChoiceGroup.deleteMany({ where: { productId } });
      for (const group of groups) {
        await tx.productChoiceGroup.create({
          data: { productId, key: group.key, label: group.label, required: group.required,
            sortOrder: group.sortOrder, values: group.values },
        });
      }
      return groups;
    });
    if (!result) return adminFailure(request, "Product not found.", 404);
    return adminJson(request, result);
  } catch (error) {
    if (error instanceof ValidationError) return adminFailure(request, error.message, 400);
    return adminUnexpected(request, error);
  }
}
