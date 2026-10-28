import { getPrisma } from "@/lib/db/prisma";
import type { BackendProduct } from "@/types/backend";
import { deserializeProductChoiceGroups } from "@/lib/commerce/product-choices";
import { publicVariant } from "@/lib/commerce/product-variants";
import { publicSpecifications } from "@/lib/admin/product-attributes";
import { eligiblePublicCategoryIds, publicProductVisibilityWhere } from "@/lib/commerce/catalog-visibility";
import { findCatalogPricePage, type CatalogStockFilter } from "@/lib/db/catalog-price-query";
import type { AttributeFilter,PublicAttributeFacet } from "@/lib/storefront/attribute-filters";
import type { Prisma } from "@/generated/prisma/client";

export function serializeProduct(product: {
  id: string;
  slug: string;
  sku: string;
  name: string;
  shortDescription: string | null;
  description: string;
  priceMinor: number;
  compareAtMinor: number | null;
  currency: string;
  rating: number;
  reviewCount: number;
  brand: { name: string; slug: string } | null;
  category: { name: string; slug: string; attributes?: Array<{slug:string;name:string;type:import("@/generated/prisma/client").AttributeType;required:boolean;active:boolean;options:unknown;sortOrder:number}> } | null;
  attributes?: unknown;
  images: Array<{ url: string; alt: string }>;
  inventory: Array<{ onHand: number; reserved: number }>;
  choiceGroups: Array<{ key: string; label: string; required: boolean; sortOrder: number; values: unknown }>;
  variants: Array<{ id: string; choices: unknown; signature: string; sku: string; priceMinor: number; onHand: number; reserved: number; active: boolean }>;
  createdAt: Date;
}): BackendProduct {
  return {
    ...product,
    category: product.category ? {name:product.category.name,slug:product.category.slug}:null,
    specifications: publicSpecifications(product.category?.attributes ?? [],product.attributes),
    images: product.images,
    choiceGroups: deserializeProductChoiceGroups(product.choiceGroups),
    hasPricedVariants: product.variants.length > 0,
    variants: product.variants.filter(row => row.active).map(row => publicVariant({ ...row,
      choices: row.choices as Record<string, string>,
    })),
    availableStock: product.variants.length ? product.variants.filter(row => row.active)
      .reduce((sum, item) => sum + Math.max(0, item.onHand - item.reserved), 0)
      : product.inventory.reduce((sum, item) => sum + Math.max(0, item.onHand - item.reserved), 0),
    createdAt: product.createdAt.toISOString(),
  };
}

const include = {
  brand: { select: { name: true, slug: true } },
  category: { select: { name: true, slug: true, attributes: { select: {slug:true,name:true,type:true,required:true,active:true,options:true,sortOrder:true} } } },
  images: { orderBy: { sortOrder: "asc" as const }, select: { url: true, alt: true } },
  inventory: { select: { onHand: true, reserved: true } },
  choiceGroups: { orderBy: { sortOrder: "asc" as const }, select: { key: true, label: true, required: true, sortOrder: true, values: true } },
  variants: { select: { id: true, choices: true, signature: true, sku: true, priceMinor: true, onHand: true, reserved: true, active: true } },
};

export type ProductListQuery = {
  query?: string;
  category?: string;
  brand?: string;
  categories?: string[];
  brands?: string[];
  attributeFilters?:AttributeFilter[];
  invalidAttributes?:boolean;
  minPriceMinor?: number;
  maxPriceMinor?: number;
  minRating?: number;
  stock?: CatalogStockFilter;
  sort?: "featured" | "newest" | "price-low" | "price-high" | "rating";
  limit?: number;
  offset?: number;
};

export async function listProducts(input: ProductListQuery) {
  if(input.invalidAttributes)return {items:[] as BackendProduct[],total:0,
    limit:Math.min(Math.max(Math.floor(input.limit??24),1),100),
    offset:Math.max(0,input.offset??0)};
  const prisma = getPrisma();
  const eligibleIds = await eligiblePublicCategoryIds(prisma);
  const visibility = publicProductVisibilityWhere(eligibleIds);
  const limit = Number.isFinite(input.limit) ? Math.min(Math.max(Math.floor(input.limit!), 1), 100) : 24;
  const offset = Number.isFinite(input.offset) ? Math.min(Math.max(Math.floor(input.offset!), 0), 1_000_000) : 0;
  const query = input.query?.trim().slice(0, 100);
  const categories = input.categories?.length ? input.categories : input.category ? [input.category] : [];
  const brands = input.brands?.length ? input.brands : input.brand ? [input.brand] : [];
  const and: Prisma.ProductWhereInput[] = [];
  if (query) {
    and.push({
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { sku: { contains: query, mode: "insensitive" } },
        { variants: { some: { active: true, sku: { contains: query, mode: "insensitive" } } } },
        { description: { contains: query, mode: "insensitive" } },
        { shortDescription: { contains: query, mode: "insensitive" } },
        { brand: { name: { contains: query, mode: "insensitive" } } },
        { category: { name: { contains: query, mode: "insensitive" } } },
      ],
    });
  }
  if (categories.length) and.push({ category: { slug: { in: categories } } });
  if (brands.length) and.push({ brand: { slug: { in: brands } } });
  if (input.minRating !== undefined) and.push({ rating: { gte: input.minRating } });

  const where: Prisma.ProductWhereInput = { status: "ACTIVE", AND: [visibility, ...and] };
  const orderBy: Prisma.ProductOrderByWithRelationInput[] =
    input.sort === "price-low" ? [{ priceMinor: "asc" }, { id: "asc" }] :
    input.sort === "price-high" ? [{ priceMinor: "desc" }, { id: "asc" }] :
    input.sort === "rating" ? [{ rating: "desc" }, { reviewCount: "desc" }, { id: "asc" }] :
    input.sort === "newest" ? [{ createdAt: "desc" }, { id: "asc" }] :
    [{ featured: "desc" }, { createdAt: "desc" }, { id: "asc" }];

  // Stock and effective SKU price predicates must be applied BEFORE LIMIT.
  if (input.attributeFilters?.length || input.stock || input.minPriceMinor !== undefined || input.maxPriceMinor !== undefined ||
      input.sort === "price-low" || input.sort === "price-high") {
    const page = await findCatalogPricePage({
      query, categories, brands, eligibleCategoryIds: eligibleIds,
      attributeFilters:input.attributeFilters,
      stock: input.stock,
      minPriceMinor: input.minPriceMinor,
      maxPriceMinor: input.maxPriceMinor,
      minRating: input.minRating,
      sort: input.sort ?? "featured", limit, offset,
    });
    if (!page.ids.length) return { items: [], total: page.total, limit, offset };
    const rows = await prisma.product.findMany({ where: { id: { in: page.ids }, status: "ACTIVE", AND: [visibility] }, include });
    const byId = new Map(rows.map(row => [row.id, row]));
    return {
      items: page.ids.map(id => byId.get(id)).filter((row): row is NonNullable<typeof row> => row !== undefined)
        .map(serializeProduct),
      total: page.total, limit, offset,
    };
  }

  const [rows, total] = await Promise.all([
    prisma.product.findMany({ where, include, orderBy, take: limit, skip: offset }),
    prisma.product.count({ where }),
  ]);
  return { items: rows.map(serializeProduct), total, limit, offset };
}

export async function listPublicCatalogFacets() {
  const prisma = getPrisma();
  const visibleIds = await eligiblePublicCategoryIds(prisma);
  const publicWhere = { status: "ACTIVE" as const, AND: [publicProductVisibilityWhere(visibleIds)] };
  const [categories, brands] = await Promise.all([
    prisma.category.findMany({
      where: { id: { in: visibleIds }, products: { some: publicWhere } },
      select: { slug: true, name: true },
      orderBy: { name: "asc" },
      take: 100,
    }),
    prisma.brand.findMany({
      where: { active: true, products: { some: publicWhere } },
      select: { slug: true, name: true },
      orderBy: { name: "asc" },
      take: 100,
    }),
  ]);
  return { categories, brands };
}

export async function getProductBySlug(slug: string) {
  const prisma = getPrisma();
  const visibleIds = await eligiblePublicCategoryIds(prisma);
  const product = await prisma.product.findFirst({ where: {
    slug, status: "ACTIVE", AND: [publicProductVisibilityWhere(visibleIds)] }, include });
  return product ? serializeProduct(product) : null;
}


/** Real owner-defined facets from eligible, published categories only.
 * Avoid hardcoding RAM, color or material. Free text and numeric specifications
 * allow exact-value filters; select values come from approved definitions.
 */
export async function listPublicAttributeFacets():Promise<PublicAttributeFacet[]>{
  const prisma=getPrisma();
  const visibleIds=await eligiblePublicCategoryIds(prisma);
  if(!visibleIds.length)return [];
  const definitions=await prisma.attributeDefinition.findMany({
    where:{
      categoryId:{in:visibleIds},active:true,
      type:{in:["SELECT","MULTI_SELECT","COLOR","BOOLEAN","TEXT","NUMBER"]},
      category:{products:{some:{
        status:"ACTIVE",AND:[publicProductVisibilityWhere(visibleIds)],
      }}},
    },
    select:{
      slug:true,name:true,type:true,options:true,
      category:{select:{slug:true}},
    },
    orderBy:[{categoryId:"asc"},{sortOrder:"asc"},{name:"asc"}],
    take:100,
  });
  return definitions.map(d=>({
    category:d.category.slug,slug:d.slug,label:d.name,
    type:d.type as PublicAttributeFacet["type"],
    options:d.type==="BOOLEAN"?["true","false"]:
      Array.isArray(d.options)?d.options.filter((v):v is string=>typeof v==="string").slice(0,40):[],
  }));
}
