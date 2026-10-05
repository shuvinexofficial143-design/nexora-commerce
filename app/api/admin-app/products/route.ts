import { getPrisma } from "@/lib/db/prisma";
import { getYouTubeVideoId, isDirectVideoUrl } from "@/lib/product-media";
import {
  adminFailure,
  adminJson,
  adminOptions,
  adminUnexpected,
  requireAdmin,
} from "@/lib/admin/admin-api";

export const runtime = "nodejs";

export function OPTIONS(request: Request) {
  return adminOptions(request);
}

export async function GET(request: Request) {
  try {
    const session = await requireAdmin(request);
    if (!session) return adminFailure(request, "Admin authorization required.", 401);

    const products = await getPrisma().product.findMany({
      orderBy: { updatedAt: "desc" },
      take: 100,
      include: {
        brand: { select: { name: true } },
        category: { select: { name: true } },
        inventory: {
          select: { onHand: true, reserved: true },
        },
        images: {
          orderBy: { sortOrder: "asc" },
          select: { url: true, alt: true, sortOrder: true },
        },
      },
    });

    return adminJson(
      request,
      products.map((product) => {
        const video = product.images.find(
          (item) => isDirectVideoUrl(item.url) || Boolean(getYouTubeVideoId(item.url)),
        );
        const poster = product.images.find(
          (item) => !isDirectVideoUrl(item.url) && !getYouTubeVideoId(item.url),
        );

        return {
        id: product.id,
        slug: product.slug,
        sku: product.sku,
        name: product.name,
        priceMinor: product.priceMinor,
        status: product.status,
        brand: product.brand?.name ?? null,
        category: product.category?.name ?? null,
        onHand: product.inventory.reduce((sum, item) => sum + item.onHand, 0),
        reserved: product.inventory.reduce((sum, item) => sum + item.reserved, 0),
        videoUrl: video?.url ?? null,
        posterUrl: poster?.url ?? null,
        media: product.images,
        updatedAt: product.updatedAt.toISOString(),
      };
      }),
    );
  } catch (error) {
    return adminUnexpected(request, error);
  }
}
