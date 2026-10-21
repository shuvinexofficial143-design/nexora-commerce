import { getPrisma, isDatabaseConfigured } from "@/lib/db/prisma";

export type HomepageBannerData = {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string;
  mobileImageUrl: string | null;
  ctaText: string;
  ctaHref: string;
  categorySlug: string | null;
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
  const title = String(input.title ?? "").trim();
  const imageUrl = String(input.imageUrl ?? "").trim();
  const ctaText = String(input.ctaText ?? "").trim();
  const ctaHref = String(input.ctaHref ?? "").trim();
  if (title.length < 2 || imageUrl.length < 8 || ctaText.length < 2 || !ctaHref.startsWith("/")) {
    throw new Error("Banner title, image, CTA text and an internal CTA link are required.");
  }
  return { title, imageUrl, ctaText, ctaHref, description: String(input.description ?? "").trim() || null, mobileImageUrl: String(input.mobileImageUrl ?? "").trim() || null, categorySlug: String(input.categorySlug ?? "").trim().toLowerCase() || null, sortOrder: Math.max(0, Number(input.sortOrder) || 0), published: Boolean(input.published), archived: Boolean(input.archived) };
}