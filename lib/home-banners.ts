import { getPrisma, isDatabaseConfigured } from "@/lib/db/prisma";
import { isSupportedPosterUrl } from "@/lib/product-media";

export type HomepageBannerData = {
  id: string; title: string; description: string | null; imageUrl: string;
  mobileImageUrl: string | null; ctaText: string; ctaHref: string; categorySlug: string | null;
};

export async function getPublishedHomepageBanners(): Promise<HomepageBannerData[]> {
  if (!isDatabaseConfigured()) return [];
  try {
    return await getPrisma().homepageBanner.findMany({
      where: { published: true, archived: false },
      orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
      take: 5,
      select: { id: true, title: true, description: true, imageUrl: true, mobileImageUrl: true, ctaText: true, ctaHref: true, categorySlug: true },
    });
  } catch (error) {
    console.warn("NEXORA homepage CMS unavailable; using safe hero fallback.", error);
    return [];
  }
}

export function validateBanner(input: Record<string, unknown>) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Invalid homepage banner.");
  const title = String(input.title ?? "").trim();
  const imageUrl = String(input.imageUrl ?? "").trim();
  const mobileImageUrl = String(input.mobileImageUrl ?? "").trim();
  const ctaText = String(input.ctaText ?? "").trim();
  const ctaHref = String(input.ctaHref ?? "").trim();
  const description = String(input.description ?? "").trim();
  const categorySlug = String(input.categorySlug ?? "").trim().toLowerCase();
  if (title.length < 2 || title.length > 150 || ctaText.length < 2 || ctaText.length > 60 || description.length > 1000)
    throw new Error("Banner title or CTA text length is invalid.");
  if (!isSupportedPosterUrl(imageUrl) || (mobileImageUrl && !isSupportedPosterUrl(mobileImageUrl)))
    throw new Error("Banner image must use approved HTTPS media URLs.");
  if (!/^\/(?!\/)/.test(ctaHref) || /[\\\r\n\t]/.test(ctaHref) || ctaHref.length > 400)
    throw new Error("Use a valid internal CTA link.");
  const order = input.sortOrder === undefined ? 0 : input.sortOrder;
  if (typeof order !== "number" || !Number.isInteger(order) || order < 0 || order > 100000)
    throw new Error("Display order must be an integer from 0 to 100000.");
  if (categorySlug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(categorySlug))
    throw new Error("Category slug format is invalid.");
  const archived = input.archived === true;
  return {
    title, imageUrl, ctaText, ctaHref,
    description: description || null, mobileImageUrl: mobileImageUrl || null,
    categorySlug: categorySlug || null, sortOrder: order,
    published: !archived && input.published === true, archived,
  };
}
