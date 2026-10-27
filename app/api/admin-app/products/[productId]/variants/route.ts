import { getPrisma } from "@/lib/db/prisma";
import { deserializeProductChoiceGroups } from "@/lib/commerce/product-choices";
import { validateVariantDefinition } from "@/lib/commerce/product-variants";
import { ValidationError } from "@/lib/db/errors";
import { adminFailure, adminJson, adminOptions, adminUnexpected, requireAdmin } from "@/lib/admin/admin-api";

export const runtime = "nodejs";
type Context = { params: Promise<{ productId: string }> };
export const OPTIONS = (request: Request) => adminOptions(request);

export async function GET(request: Request, { params }: Context) {
  try {
    if (!await requireAdmin(request)) return adminFailure(request, "Admin authorization required.", 401);
    const { productId } = await params;
    const product = await getPrisma().product.findUnique({ where: { id: productId },
      select: { id: true, variants: { orderBy: { createdAt: "asc" } } } });
    if (!product) return adminFailure(request, "Product not found.", 404);
    return adminJson(request, product.variants);
  } catch (error) { return adminUnexpected(request, error); }
}
export async function POST(request: Request, { params }: Context) {
  try {
    if (!await requireAdmin(request)) return adminFailure(request, "Admin authorization required.", 401);
    if (Number(request.headers.get("content-length") || 0) > 12000) return adminFailure(request, "Request too large.", 413);
    const { productId } = await params;
    const input = await request.json().catch(() => null);
    const prisma = getPrisma();
    const result = await prisma.$transaction(async tx => {
      const product = await tx.product.findUnique({ where: { id: productId },
        include: { choiceGroups: true } });
      if (!product) throw new ValidationError("Product not found.");
      const choiceGroups = deserializeProductChoiceGroups(product.choiceGroups);
      const variant = validateVariantDefinition(choiceGroups, input);
      // Parent SKUs cannot be reused as child variants.
      if (await tx.product.findUnique({ where: { sku: variant.sku }, select: { id: true } })) {
        throw new ValidationError("SKU is already assigned to a base product.");
      }
      return tx.productVariant.create({ data: { ...variant, productId } });
    });
    return adminJson(request, result, 201);
  } catch (error) {
    if (error instanceof ValidationError) return adminFailure(request, error.message, 400);
    if ((error as {code?: string})?.code === "P2002") return adminFailure(request, "Duplicate variant SKU or option combination.", 409);
    return adminUnexpected(request, error);
  }
}
export async function PATCH(request: Request, { params }: Context) {
  try {
    if (!await requireAdmin(request)) return adminFailure(request, "Admin authorization required.", 401);
    const { productId } = await params;
    const raw = await request.json().catch(() => null) as Record<string, unknown> | null;
    if (!raw || typeof raw.id !== "string" || !raw.id || Object.keys(raw).some(key =>
      !["id", "priceMinor", "onHand", "active"].includes(key))) {
      return adminFailure(request, "Only variant price, total stock and active state are editable.", 400);
    }
    if (raw.priceMinor !== undefined && (!Number.isSafeInteger(raw.priceMinor) ||
      (raw.priceMinor as number) < 0 || (raw.priceMinor as number) > 100_000_000)) {
      return adminFailure(request, "Invalid SKU price.", 400);
    }
    if (raw.onHand !== undefined && (!Number.isSafeInteger(raw.onHand) ||
      (raw.onHand as number) < 0 || (raw.onHand as number) > 1_000_000)) {
      return adminFailure(request, "Invalid inventory quantity.", 400);
    }
    if (raw.active !== undefined && typeof raw.active !== "boolean") {
      return adminFailure(request, "Invalid active state.", 400);
    }
    const prisma = getPrisma();
    const current = await prisma.productVariant.findFirst({ where: { id: raw.id, productId } });
    if (!current) return adminFailure(request, "Variant SKU not found.", 404);
    // CAS protects edits against concurrent checkout reservations and admin changes.
    const updated = await prisma.productVariant.updateMany({
      where: { id: current.id, productId, updatedAt: current.updatedAt,
        ...(raw.onHand !== undefined ? { reserved: { lte: raw.onHand as number } } : {}) },
      data: {
        ...(raw.priceMinor !== undefined ? { priceMinor: raw.priceMinor as number } : {}),
        ...(raw.onHand !== undefined ? { onHand: raw.onHand as number } : {}),
        ...(raw.active !== undefined ? { active: raw.active as boolean } : {}),
      },
    });
    if (!updated.count) return adminFailure(request, "Variant changed or stock is reserved. Refresh and retry.", 409);
    return adminJson(request, await prisma.productVariant.findUniqueOrThrow({ where: { id: current.id } }));
  } catch (error) {
    return adminUnexpected(request, error);
  }
}
