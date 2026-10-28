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

export function normalizeCatalogSortOrder(value: unknown, fallback = 0): number {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < -100000 || value > 100000) {
    throw new Error("Display order must be an integer between -100000 and 100000.");
  }
  return value;
}

export async function saveCategory(id: string | undefined, input: Record<string, unknown>) {
  const prisma = getPrisma();
  const previous = id ? await prisma.category.findUnique({ where: { id } }) : null;
  if (id && !previous) throw new Error("Category not found.");
  if (input.archived === true && !previous?.archived) throw new Error("Use the archive action to archive a category.");

  // PATCH must retain fields that the editor did not explicitly change.
  const payload: Record<string, unknown> = { ...(previous ?? {}), ...input };
  const name = text(payload.name, "Category name", 2);
  const slug = slugify(text(payload.slug || name, "Category slug", 2));
  if (!slug) throw new Error("Category slug is required.");
  if (payload.parentId !== null && payload.parentId !== undefined && typeof payload.parentId !== "string") {
    throw new Error("Parent category must be a valid category ID.");
  }
  const parentId = typeof payload.parentId === "string" ? payload.parentId.trim() || null : null;
  await assertParent(prisma, parentId, id);

  // A category with children cannot become a child itself, even if those children are archived.
  if (id && parentId && parentId !== previous?.parentId) {
    const children = await prisma.category.count({ where: { parentId: id } });
    if (children) throw new Error("Move child categories before changing this category's parent.");
  }
  const duplicate = await prisma.category.findFirst({
    where: { slug, ...(id ? { NOT: { id } } : {}) }, select: { id: true },
  });
  if (duplicate) throw new Error("Category slug is already in use.");

  const archived = input.archived === false ? false : previous?.archived ?? false;
  const data = {
    name, slug, parentId, archived,
    description: typeof payload.description === "string" ? payload.description.trim() || null : null,
    imageUrl: safeImageUrl(payload.imageUrl),
    sortOrder: normalizeCatalogSortOrder(payload.sortOrder),
    visible: !archived && payload.visible !== false,
  };
  return id ? prisma.category.update({ where: { id }, data }) :
    prisma.category.create({ data: { ...data, id: randomUUID() } });
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
  const prisma = getPrisma();
  const previous = id ? await prisma.brand.findUnique({ where: { id } }) : null;
  if (id && !previous) throw new Error("Brand not found.");
  const payload: Record<string, unknown> = { ...(previous ?? {}), ...input };
  const name = text(payload.name, "Brand name", 2);
  const slug = slugify(text(payload.slug || name, "Brand slug", 2));
  if (!slug) throw new Error("Brand slug is required.");
  const duplicate = await prisma.brand.findFirst({
    where: { slug, ...(id ? { NOT: { id } } : {}) }, select: { id: true },
  });
  if (duplicate) throw new Error("Brand slug is already in use.");
  const data = {
    name, slug,
    description: typeof payload.description === "string" ? payload.description.trim() || null : null,
    logoUrl: safeImageUrl(payload.logoUrl),
    active: payload.active !== false,
    featured: payload.featured === true,
  };
  return id ? prisma.brand.update({ where: { id }, data }) :
    prisma.brand.create({ data: { ...data, id: randomUUID() } });
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

export function validateProductAttributes(definitions: Array<{
  slug: string; name: string; type: string; required: boolean; active: boolean; options: unknown;
}>, value: unknown) {
  if (value != null && (typeof value !== "object" || Array.isArray(value))) {
    throw new Error("Product attributes must be an object.");
  }
  const input = (value ?? {}) as Record<string, unknown>;
  const output: Record<string, unknown> = {};
  for (const definition of definitions.filter((item) => item.active)) {
    const current = input[definition.slug];
    if (current == null || current === "" || (Array.isArray(current) && current.length === 0)) {
      if (definition.required) throw new Error(definition.name + " is required.");
      continue;
    }
    switch (definition.type) {
      case "NUMBER":
        if (typeof current !== "number" || !Number.isFinite(current)) throw new Error(definition.name + " must be a number.");
        break;
      case "BOOLEAN":
        if (typeof current !== "boolean") throw new Error(definition.name + " must be true or false.");
        break;
      case "SELECT":
      case "COLOR":
        if (typeof current !== "string" || !Array.isArray(definition.options) || !definition.options.includes(current)) {
          throw new Error(definition.name + " has an invalid value.");
        }
        break;
      case "MULTI_SELECT":
        if (!Array.isArray(current) || !current.every((item) => typeof item === "string" && Array.isArray(definition.options) && definition.options.includes(item))) {
          throw new Error(definition.name + " has invalid values.");
        }
        break;
      case "DATE":
        if (typeof current !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(current) || Number.isNaN(Date.parse(current)) ||
          new Date(current).toISOString().slice(0, 10) !== current) {
          throw new Error(definition.name + " must be a valid date.");
        }
        break;
      case "TEXT":
      case "IMAGE_REQUEST":
        if (typeof current !== "string" || !current.trim() || current.length > 2000) {
          throw new Error(definition.name + " must be text under 2000 characters.");
        }
        break;
      default: throw new Error("Unsupported product attribute type.");
    }
    output[definition.slug] = current;
  }
  return output;
}

// Never allow new product assignments to hidden/archived categories or inactive brands.
export function requireAssignableCategory(category: { id: string; archived: boolean; visible: boolean } | null): string {
  if (!category || category.archived || !category.visible) {
    throw new Error("Select an active, visible category.");
  }
  return category.id;
}

export function requireAssignableBrand(brand: { id: string; active: boolean } | null): string {
  if (!brand || !brand.active) throw new Error("Select an active brand.");
  return brand.id;
}
