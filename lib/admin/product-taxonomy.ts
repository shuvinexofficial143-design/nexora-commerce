import { ConflictError, ValidationError } from "@/lib/db/errors";
import { getPrisma } from "@/lib/db/prisma";

export type TaxonomyKind = "category" | "brand";
export type ProductTaxonomySelection = {
  categorySlug?: string | null;
  brandSlug?: string | null;
};
const slugPattern = /^[a-z0-9][a-z0-9-]{0,63}$/;

export function validTaxonomySlug(value: unknown): string {
  if (typeof value !== "string" || !slugPattern.test(value))
    throw new ValidationError("Choose an existing valid category/brand slug.");
  return value;
}
export function parseTaxonomySelection(input: Record<string, unknown>): ProductTaxonomySelection {
  const result: ProductTaxonomySelection = {};
  for (const [field, key] of [["categorySlug", "categorySlug"],["brandSlug", "brandSlug"]] as const) {
    if (!(field in input)) continue;
    const raw = input[field];
    if (raw === null || raw === "") result[key] = null;
    else result[key] = validTaxonomySlug(raw);
  }
  return result;
}
export function parseTaxonomyCreation(raw: unknown) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw))
    throw new ValidationError("Invalid catalog option request.");
  const body = raw as Record<string,unknown>;
  if (body.kind !== "category" && body.kind !== "brand")
    throw new ValidationError("Choose category or brand.");
  if (typeof body.name !== "string" || body.name.trim().length < 2 || body.name.trim().length > 80)
    throw new ValidationError("Name must be 2–80 characters.");
  const name = body.name.trim().replace(/\s+/g, " ");
  const slug = typeof body.slug === "string" && body.slug.trim() ?
    body.slug.trim().toLowerCase() :
    name.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  if (!slugPattern.test(slug))
    throw new ValidationError("Slug must be 1–64 lowercase letters, numbers or hyphens.");
  return { kind: body.kind as TaxonomyKind, name, slug };
}
export async function listProductTaxonomy() {
  const prisma = getPrisma();
  const [categories, brands] = await Promise.all([
    prisma.category.findMany({ select: { id:true, name:true, slug:true }, orderBy:{name:"asc"}, take:500 }),
    prisma.brand.findMany({ select: { id:true, name:true, slug:true }, orderBy:{name:"asc"}, take:500 }),
  ]);
  return { categories, brands };
}
export async function createProductTaxonomy(raw: unknown) {
  const data = parseTaxonomyCreation(raw);
  const prisma = getPrisma();
  try {
    if (data.kind === "category") {
      const record = await prisma.category.create({ data: { name:data.name, slug:data.slug } });
      return { kind: data.kind, id:record.id, name:record.name, slug:record.slug };
    }
    const record = await prisma.brand.create({ data: { name:data.name, slug:data.slug } });
    return { kind: data.kind, id:record.id, name:record.name, slug:record.slug };
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002")
      throw new ConflictError("That category/brand slug already exists.");
    throw error;
  }
}
