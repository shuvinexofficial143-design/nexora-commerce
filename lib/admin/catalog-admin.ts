import { randomUUID } from "node:crypto";
import { getPrisma } from "@/lib/db/prisma";

const slugify = (value: string) => value.trim().toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const text = (value: unknown, label: string, min = 1) => {
  const result = String(value ?? "").trim();
  if (result.length < min) throw new Error(`${label} is required.`);
  return result;
};

function safeImageUrl(value: unknown) {
  if (value == null || value === "") return null;
  try {
    const url = new URL(String(value).trim());
    if (url.protocol !== "https:") throw new Error();
    const host = url.hostname.toLowerCase();
    if (!(host === "images.unsplash.com" || host === "res.cloudinary.com" || host.endsWith(".supabase.co"))) throw new Error();
    return url.toString();
  } catch { throw new Error("Image must be a supported HTTPS media URL."); }
}

async function assertParent(tx: ReturnType<typeof getPrisma>, parentId: string | null, currentId?: string) {
  if (!parentId) return;
  if (parentId === currentId) throw new Error("A category cannot be its own parent.");
  const parent = await tx.category.findUnique({ where: { id: parentId }, select: { parentId: true, archived: true } });
  if (!parent || parent.archived) throw new Error("Parent category is unavailable.");
  if (parent.parentId) throw new Error("Categories support one nested level only.");
}

export async function listCategories(input: { query?: string; includeArchived?: boolean } = {}) {
  const query = input.query?.trim();
  return getPrisma().category.findMany({
    where: { ...(input.includeArchived ? {} : { archived: false }), ...(query ? { OR: [{ name: { contains: query, mode: "insensitive" } }, { slug: { contains: query, mode: "insensitive" } }] } : {}) },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { parent: { select: { name: true } }, _count: { select: { products: true, children: true } } },
  });
}

export async function saveCategory(id: string | undefined, input: Record<string, unknown>) {
  const name = text(input.name, "Category name", 2);
  const slug = slugify(text(input.slug || name, "Category slug", 2));
  if (!slug) throw new Error("Category slug is required.");
  const parentId = typeof input.parentId === "string" && input.parentId ? input.parentId : null;
  const prisma = getPrisma();
  await assertParent(prisma, parentId, id);
  const duplicate = await prisma.category.findFirst({ where: { slug, ...(id ? { NOT: { id } } : {}) }, select: { id: true } });
  if (duplicate) throw new Error("Category slug is already in use.");
  const data = { name, slug, description: typeof input.description === "string" ? input.description.trim() || null : null, imageUrl: safeImageUrl(input.imageUrl), sortOrder: Number.isInteger(input.sortOrder) ? Number(input.sortOrder) : 0, visible: input.visible !== false, ...(parentId !== undefined ? { parentId } : {}) };
  return id ? prisma.category.update({ where: { id }, data }) : prisma.category.create({ data: { ...data, id: randomUUID() } });
}

export async function archiveCategory(id: string) {
  const category = await getPrisma().category.findUniqueOrThrow({ where: { id }, include: { _count: { select: { products: true, children: true } } } });
  if (category._count.products > 0) throw new Error("Move or remove the category's products before archiving it.");
  if (category._count.children > 0) throw new Error("Archive or reassign child categories first.");
  return getPrisma().category.update({ where: { id }, data: { archived: true, visible: false } });
}

export async function listBrands(input: { query?: string; includeInactive?: boolean } = {}) {
  const query = input.query?.trim();
  return getPrisma().brand.findMany({ where: { ...(input.includeInactive ? {} : { active: true }), ...(query ? { OR: [{ name: { contains: query, mode: "insensitive" } }, { slug: { contains: query, mode: "insensitive" } }] } : {}) }, orderBy: { name: "asc" }, include: { _count: { select: { products: true } } } });
}

export async function saveBrand(id: string | undefined, input: Record<string, unknown>) {
  const name = text(input.name, "Brand name", 2);
  const slug = slugify(text(input.slug || name, "Brand slug", 2));
  const prisma = getPrisma();
  const duplicate = await prisma.brand.findFirst({ where: { slug, ...(id ? { NOT: { id } } : {}) }, select: { id: true } });
  if (duplicate) throw new Error("Brand slug is already in use.");
  const data = { name, slug, description: typeof input.description === "string" ? input.description.trim() || null : null, logoUrl: safeImageUrl(input.logoUrl), active: input.active !== false, featured: input.featured === true };
  return id ? prisma.brand.update({ where: { id }, data }) : prisma.brand.create({ data: { ...data, id: randomUUID() } });
}

export async function archiveBrand(id: string) {
  return getPrisma().brand.update({ where: { id }, data: { active: false } });
}

const attributeTypes = new Set(["TEXT", "NUMBER", "SELECT", "MULTI_SELECT", "BOOLEAN", "COLOR", "DATE", "IMAGE_REQUEST"]);
export async function listAttributeDefinitions(categoryId?: string) {
  return getPrisma().attributeDefinition.findMany({ where: categoryId ? { categoryId } : undefined, orderBy: [{ categoryId: "asc" }, { sortOrder: "asc" }, { name: "asc" }] });
}
export async function saveAttributeDefinition(id: string | undefined, input: Record<string, unknown>) {
  const categoryId = text(input.categoryId, "Category");
  const name = text(input.name, "Attribute name", 2);
  const type = String(input.type || "TEXT").toUpperCase();
  if (!attributeTypes.has(type)) throw new Error("Unsupported attribute type.");
  const options = Array.isArray(input.options) ? input.options.map(String).map((v) => v.trim()).filter(Boolean) : [];
  if (["SELECT", "MULTI_SELECT", "COLOR"].includes(type) && !options.length) throw new Error("Allowed values are required for this attribute type.");
  const prisma = getPrisma();
  const data = { categoryId, name, slug: slugify(name), type: type as "TEXT" | "NUMBER" | "SELECT" | "MULTI_SELECT" | "BOOLEAN" | "COLOR" | "DATE" | "IMAGE_REQUEST", required: input.required === true, options, sortOrder: Number.isInteger(input.sortOrder) ? Number(input.sortOrder) : 0, active: input.active !== false };
  return id ? prisma.attributeDefinition.update({ where: { id }, data }) : prisma.attributeDefinition.create({ data: { ...data, id: randomUUID() } });
}
export async function archiveAttributeDefinition(id: string) { return getPrisma().attributeDefinition.update({ where: { id }, data: { active: false } }); }

export function validateProductAttributes(definitions: Array<{ slug: string; name: string; type: string; required: boolean; active: boolean; options: unknown }>, value: unknown) {
  if (value == null) return {};
  if (typeof value !== "object" || Array.isArray(value)) throw new Error("Product attributes must be an object.");
  const input = value as Record<string, unknown>;
  const output: Record<string, unknown> = {};
  for (const definition of definitions.filter((item) => item.active)) {
    const current = input[definition.slug];
    if (definition.required && (current == null || current === "" || (Array.isArray(current) && current.length === 0))) throw new Error(`${definition.name} is required.`);
    if (current == null || current === "") continue;
    if (definition.type === "NUMBER" && (typeof current !== "number" || !Number.isFinite(current))) throw new Error(`${definition.name} must be a number.`);
    if (definition.type === "BOOLEAN" && typeof current !== "boolean") throw new Error(`${definition.name} must be true or false.`);
    if (["SELECT", "COLOR"].includes(definition.type) && (!Array.isArray(definition.options) || !definition.options.includes(current))) throw new Error(`${definition.name} has an invalid value.`);
    if (definition.type === "MULTI_SELECT" && (!Array.isArray(current) || !current.every((item) => Array.isArray(definition.options) && definition.options.includes(item)))) throw new Error(`${definition.name} has invalid values.`);
    output[definition.slug] = current;
  }
  return output;
}