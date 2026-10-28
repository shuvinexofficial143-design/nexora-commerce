import { getPrisma, isDatabaseConfigured } from "@/lib/db/prisma";
import { NotFoundError, ValidationError } from "@/lib/db/errors";
import { isSupportedPosterUrl } from "@/lib/product-media";
import { eligiblePublicCategoryIds } from "@/lib/commerce/catalog-visibility";

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
const CATEGORY = /^[a-z0-9][a-z0-9-]{0,63}$/;
const SAFE_ROUTE = /^\/(?:shop|search|track-order|product\/[a-z0-9][a-z0-9-]{0,100})\/?$/;
function cleanText(value: unknown, label: string, min: number, max: number): string {
  if (typeof value !== "string") throw new ValidationError(label + " is required.");
  const text = value.trim().replace(/\s+/g," ");
  if (text.length < min || text.length > max) throw new ValidationError(label + " must be " + min + "–" + max + " characters.");
  return text;
}
/** Prevent protocol-relative/external redirects, script URLs, and unpublished
 * marketing shortcuts. Only actual supported customer routes are accepted. */
export function validateBannerLink(value: unknown) {
  const path = cleanText(value, "Banner link", 2, 512);
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\") ||
      /[\u0000-\u001f\u007f]/.test(path) || path.includes("#"))
    throw new ValidationError("Banner CTA must be an internal store link.");
  const url = new URL(path, "https://nexora.invalid");
  if (url.origin !== "https://nexora.invalid" || !SAFE_ROUTE.test(url.pathname) ||
      url.pathname.includes("%"))
    throw new ValidationError("Banner CTA must link to Shop, Search, Tracking or Product.");
  // Do not accept malformed/oversized filter names or pseudo-link parameters.
  for (const [key, val] of url.searchParams) {
    if (!["category","q","sort","page","stock","brand","brands","categories"].includes(key) ||
        val.length > 120 || /[\u0000-\u001f]/.test(val))
      throw new ValidationError("Unsupported banner URL parameter.");
  }
  return path;
}
/** Cline-compatible full CMS record, with strict validation and safe defaults.
 * This function is used on both create and PATCH (merged existing record). */
export function validateBanner(raw: unknown) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw))
    throw new ValidationError("Invalid homepage banner.");
  const x = raw as Record<string, unknown>;
  const title = cleanText(x.title, "Banner title", 2, 120);
  const imageUrl = cleanText(x.imageUrl, "Banner image", 8, 1000);
  if (!isSupportedPosterUrl(imageUrl)) throw new ValidationError(
    "Banner image must use approved HTTPS image storage.");
  const mobileImageUrl = x.mobileImageUrl === undefined || x.mobileImageUrl === null ||
    x.mobileImageUrl === "" ? null : cleanText(x.mobileImageUrl, "Mobile banner image", 8, 1000);
  if (mobileImageUrl && !isSupportedPosterUrl(mobileImageUrl))
    throw new ValidationError("Mobile image must use approved HTTPS image storage.");
  const description = x.description === undefined || x.description === null ||
    x.description === "" ? null : cleanText(x.description, "Banner description", 1, 350);
  const ctaText = cleanText(x.ctaText, "Banner button", 2, 40);
  const ctaHref = validateBannerLink(x.ctaHref);
  const categorySlug = x.categorySlug === undefined || x.categorySlug === null ||
    x.categorySlug === "" ? null : cleanText(x.categorySlug, "Category slug", 1, 64);
  if (categorySlug && !CATEGORY.test(categorySlug))
    throw new ValidationError("Invalid category slug.");
  const sortOrder = x.sortOrder === undefined ? 0 : x.sortOrder;
  if (typeof sortOrder !== "number" || !Number.isInteger(sortOrder) ||
      sortOrder < 0 || sortOrder > 1000)
    throw new ValidationError("Banner order must be an integer from 0–1000.");
  for (const flag of ["published","archived"] as const) {
    if (x[flag] !== undefined && typeof x[flag] !== "boolean")
      throw new ValidationError(flag + " must be true or false.");
  }
  const archived = x.archived === true;
  return {
    title, description, imageUrl, mobileImageUrl, ctaText, ctaHref, categorySlug,
    sortOrder, published: !archived && x.published === true, archived,
  };
}
export async function getPublishedHomepageBanners(): Promise<HomepageBannerData[]> {
  if (!isDatabaseConfigured()) return [];
  try {
    const rows = await getPrisma().homepageBanner.findMany({
      where:{published:true, archived:false},
      orderBy:[{sortOrder:"asc"},{updatedAt:"desc"},{id:"asc"}],take:5,
      select:{id:true,title:true,description:true,imageUrl:true,mobileImageUrl:true,
        ctaText:true,ctaHref:true,categorySlug:true,sortOrder:true,published:true,archived:true},
    });
    // Published campaigns must not advertise a hidden/archived category or
    // a child of a hidden ancestor. A missing/deleted category fails closed.
    const prisma = getPrisma();
    const ids = await eligiblePublicCategoryIds(prisma);
    const categories = await prisma.category.findMany({
      where: { id: { in: ids } }, select: { slug: true },
    });
    const permitted = new Set(categories.map(row => row.slug));
    // Preexisting CMS data may predate strict validation: fail closed.
    return rows.filter(row=>{
      try {
        validateBanner(row);
        if(row.categorySlug && !permitted.has(row.categorySlug))return false;
        const url=new URL(row.ctaHref,"https://nexora.invalid");
        const cat=url.searchParams.get("category");
        return !cat || permitted.has(cat);
      } catch {return false;}
    })
      .map(({id,title,description,imageUrl,mobileImageUrl,ctaText,ctaHref,categorySlug})=>({
        id,title,description,imageUrl,mobileImageUrl,ctaText,ctaHref,categorySlug,
      }));
  } catch (error) {
    console.error("NEXORA public homepage banners unavailable", error instanceof Error ? error.name : "Unknown error");
    return [];
  }
}
export async function listAdminHomepageBanners() {
  return getPrisma().homepageBanner.findMany({
    orderBy:[{archived:"asc"},{sortOrder:"asc"},{updatedAt:"desc"}],take:100,
  });
}
export async function createHomepageBanner(raw: unknown) {
  return getPrisma().homepageBanner.create({data:validateBanner(raw)});
}
export async function updateHomepageBanner(id: string, patch: unknown) {
  if (!id || id.length > 128 || !/^[A-Za-z0-9_-]+$/.test(id))
    throw new ValidationError("Invalid banner id.");
  if (!patch || typeof patch !== "object" || Array.isArray(patch))
    throw new ValidationError("Invalid banner update.");
  const x = patch as Record<string,unknown>;
  const editable = ["title","description","imageUrl","mobileImageUrl","ctaText","ctaHref",
    "categorySlug","sortOrder","published","archived"];
  if (!Object.keys(x).length || Object.keys(x).some(k=>!editable.includes(k)))
    throw new ValidationError("Unsupported banner update fields.");
  return getPrisma().$transaction(async tx=>{
    const existing = await tx.homepageBanner.findUnique({where:{id}});
    if (!existing) throw new NotFoundError("Homepage banner not found.");
    const validated = validateBanner({...existing,...x});
    // Do not re-publish archived banners accidentally: owner must explicitly
    // unarchive and publish with a subsequent deliberate edit.
    if (existing.archived && x.archived !== false && x.published === true)
      throw new ValidationError("Unarchive the banner before publishing.");
    return tx.homepageBanner.update({where:{id},data:validated});
  });
}
