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
  const parentSlug = body.parentSlug === undefined || body.parentSlug === "" || body.parentSlug === null
    ? null : validTaxonomySlug(body.parentSlug);
  if (body.kind === "brand" && parentSlug) throw new ValidationError("Brands cannot have a parent category.");
  return { kind: body.kind as TaxonomyKind, name, slug, ...(parentSlug ? {parentSlug} : {}) };
}
export async function listProductTaxonomy() {
  const prisma = getPrisma();
  const [categories, brands] = await Promise.all([
    prisma.category.findMany({ select: { id:true, name:true, slug:true, parentId:true, visible:true, archived:true, sortOrder:true }, orderBy:[{sortOrder:"asc"},{name:"asc"}], take:500 }),
    prisma.brand.findMany({ select: { id:true, name:true, slug:true, active:true, featured:true }, orderBy:{name:"asc"}, take:500 }),
  ]);
  return { categories, brands };
}
export async function createProductTaxonomy(raw: unknown) {
  const data = parseTaxonomyCreation(raw);
  const prisma = getPrisma();
  try {
    if (data.kind === "category") {
      const parent = data.parentSlug ? await prisma.category.findUnique({
        where:{slug:data.parentSlug},select:{id:true},
      }) : null;
      if (data.parentSlug && !parent) throw new ValidationError("Parent category does not exist.");
      const record = await prisma.category.create({ data: {
        name:data.name, slug:data.slug, parentId:parent?.id ?? null,
      } });
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


function booleanField(value: unknown, label: string) {
  if (typeof value !== "boolean") throw new ValidationError(label + " must be true or false.");
  return value;
}
export function parseTaxonomyUpdate(raw: unknown) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw))
    throw new ValidationError("Invalid category or brand update.");
  const x=raw as Record<string,unknown>;
  if (x.kind !== "category" && x.kind !== "brand")
    throw new ValidationError("Category or brand is required.");
  const slug=validTaxonomySlug(x.slug);
  const kind=x.kind as TaxonomyKind;
  const allowed=kind==="category" ?
    ["kind","slug","visible","archived","sortOrder","parentSlug"]:
    ["kind","slug","active","featured"];
  if(Object.keys(x).some(key=>!allowed.includes(key)) || Object.keys(x).length < 3)
    throw new ValidationError("Unsupported or empty catalog update.");
  const patch:Record<string, unknown>={};
  for(const key of kind==="category"?["visible","archived"]:["active","featured"]) {
    if(key in x)patch[key]=booleanField(x[key],key);
  }
  if(kind==="category"){
    if("sortOrder" in x){
      if(typeof x.sortOrder!=="number" || !Number.isInteger(x.sortOrder) ||
        x.sortOrder<0 || x.sortOrder>1000)throw new ValidationError("Invalid category order.");
      patch.sortOrder=x.sortOrder;
    }
    if("parentSlug" in x)
      patch.parentSlug=x.parentSlug===null || x.parentSlug==="" ? null : validTaxonomySlug(x.parentSlug);
  }
  if(!Object.keys(patch).length)throw new ValidationError("No changes provided.");
  return {kind,slug,patch};
}
export async function updateProductTaxonomy(raw: unknown){
  const {kind,slug,patch}=parseTaxonomyUpdate(raw);
  const prisma=getPrisma();
  return prisma.$transaction(async tx=>{
    if(kind==="brand"){
      const current=await tx.brand.findUnique({where:{slug},select:{id:true}});
      if(!current)throw new ValidationError("Brand does not exist.");
      const {active,featured}=patch as {active?:boolean;featured?:boolean};
      return tx.brand.update({where:{id:current.id},data:{
        ...(active===undefined?{}:{active}),
        ...(featured===undefined?{}:{featured}),
      }});
    }
    const category=await tx.category.findUnique({where:{slug},select:{id:true,parentId:true}});
    if(!category)throw new ValidationError("Category does not exist.");
    let parentId: string|null|undefined=undefined;
    if("parentSlug" in patch){
      const parentSlug=patch.parentSlug as string|null;
      if(parentSlug){
        const parent=await tx.category.findUnique({where:{slug:parentSlug},
          select:{id:true,parentId:true}});
        if(!parent)throw new ValidationError("Parent category does not exist.");
        parentId=parent.id;
        // Prevent cycles and never allow an ancestor chain past 1000 levels.
        const visited=new Set<string>([category.id]);
        let cursor:string|null=parent.id;
        for(let depth=0;cursor;depth++){
          if(depth>=1000 || visited.has(cursor))
            throw new ValidationError("Category hierarchy would contain a cycle.");
          visited.add(cursor);
          const ancestor: {parentId:string|null}|null=await tx.category.findUnique({
            where:{id:cursor},select:{parentId:true},
          });
          cursor=ancestor?.parentId ?? null;
        }
      }else parentId=null;
    }
    const {visible,archived,sortOrder}=patch as {
      visible?:boolean;archived?:boolean;sortOrder?:number;
    };
    return tx.category.update({where:{id:category.id},data:{
      ...(visible===undefined?{}:{visible}),
      ...(archived===undefined?{}:{archived}),
      ...(sortOrder===undefined?{}:{sortOrder}),
      ...(parentId===undefined?{}:{parentId}),
    }});
  });
}
