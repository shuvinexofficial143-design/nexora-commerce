import { randomUUID } from "node:crypto";
import { Prisma } from "@/generated/prisma/client";
import { getPrisma } from "@/lib/db/prisma";
import { ValidationError } from "@/lib/db/errors";
import { eligiblePublicCategoryIds } from "@/lib/commerce/catalog-visibility";
import { attributesForCategory, validateProductAttributes } from "@/lib/admin/product-attributes";

export type BulkProductAction="PUBLISH"|"MOVE_TO_DRAFT"|"FEATURE"|"UNFEATURE";
export type BulkProductSelection={id:string;updatedAt:string};
export type BulkProductRequest={action:BulkProductAction;products:BulkProductSelection[]};

export class BulkProductConflict extends Error {
  constructor(message="Products changed since selection. Refresh products and select them again."){
    super(message);this.name="BulkProductConflict";
  }
}
const actions:BulkProductAction[]=["PUBLISH","MOVE_TO_DRAFT","FEATURE","UNFEATURE"];
const revision=/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
export function parseBulkProductRequest(input:unknown):BulkProductRequest{
  if(!input||typeof input!=="object"||Array.isArray(input))
    throw new ValidationError("Bulk product request must be an object.");
  const value=input as Record<string,unknown>;
  if(Object.keys(value).some(k=>k!=="action"&&k!=="products"))
    throw new ValidationError("Unsupported bulk product request field.");
  if(!actions.includes(value.action as BulkProductAction))
    throw new ValidationError("Unsupported bulk product action.");
  if(!Array.isArray(value.products)||value.products.length<1||value.products.length>25)
    throw new ValidationError("Select between 1 and 25 products.");
  const seen=new Set<string>();
  const products:BulkProductSelection[]=value.products.map(item=>{
    if(!item||typeof item!=="object"||Array.isArray(item))
      throw new ValidationError("Invalid product selection.");
    const row=item as Record<string,unknown>;
    if(Object.keys(row).some(k=>k!=="id"&&k!=="updatedAt")||
      typeof row.id!=="string"||!row.id||row.id.length>128||
      typeof row.updatedAt!=="string"||!revision.test(row.updatedAt)||
      !Number.isFinite(Date.parse(row.updatedAt))||
      new Date(row.updatedAt).toISOString()!==row.updatedAt)
      throw new ValidationError("Invalid product selection or revision.");
    if(seen.has(row.id))throw new ValidationError("Duplicate products cannot be selected.");
    seen.add(row.id);
    return {id:row.id,updatedAt:row.updatedAt};
  });
  return {action:value.action as BulkProductAction,products};
}

/** Cline-compatible, revision-pinned API. Every modification and its audit row
 * share a serializable transaction; required specs and parent visibility are
 * checked for ALL draft->ACTIVE transitions before ANY write.
 */
export async function applyBulkProductAction(raw:unknown,adminUserId:string){
  const {action,products}=parseBulkProductRequest(raw);
  if(!adminUserId||adminUserId.length>128)
    throw new ValidationError("Invalid admin identity.");
  try{
    return await getPrisma().$transaction(async tx=>{
      const rows=await tx.product.findMany({
        where:{id:{in:products.map(x=>x.id)}},
        select:{id:true,name:true,status:true,featured:true,updatedAt:true,
          categoryId:true,brandId:true,attributes:true},
      });
      if(rows.length!==products.length)throw new BulkProductConflict();
      const byId=new Map(rows.map(row=>[row.id,row]));
      for(const selection of products){
        const row=byId.get(selection.id);
        if(!row||row.updatedAt.toISOString()!==selection.updatedAt)
          throw new BulkProductConflict();
        if(row.status==="ARCHIVED")
          throw new ValidationError("Archived products cannot be changed in bulk.");
      }
      if(action==="PUBLISH"){
        const eligible=new Set(await eligiblePublicCategoryIds(tx));
        const categoryIds=[...new Set(rows.map(row=>row.categoryId).filter((id):id is string=>!!id))];
        const brandIds=[...new Set(rows.map(row=>row.brandId).filter((id):id is string=>!!id))];
        const brands=await tx.brand.findMany({where:{id:{in:brandIds}},
          select:{id:true,active:true}});
        const activeBrands=new Set(brands.filter(b=>b.active).map(b=>b.id));
        const defsByCategory=new Map<string,Awaited<ReturnType<typeof attributesForCategory>>>();
        for(const categoryId of categoryIds)
          defsByCategory.set(categoryId,await attributesForCategory(tx,categoryId));
        for(const row of rows){
          // Already-published product does not need re-publishing.
          if(row.status==="ACTIVE")continue;
          if(row.categoryId&&!eligible.has(row.categoryId))
            throw new ValidationError("Unpublishable product "+row.name+": category is hidden or archived.");
          if(row.brandId&&!activeBrands.has(row.brandId))
            throw new ValidationError("Unpublishable product "+row.name+": brand is inactive.");
          validateProductAttributes(defsByCategory.get(row.categoryId??"")??[],
            row.attributes??{},true);
        }
      }
      const changes=action==="PUBLISH"?{status:"ACTIVE" as const}:
        action==="MOVE_TO_DRAFT"?{status:"DRAFT" as const}:
        action==="FEATURE"?{featured:true}:{featured:false};
      const changedIds:string[]=[];
      const unchangedIds:string[]=[];
      for(const item of products){
        const row=byId.get(item.id)!;
        const unchanged=action==="PUBLISH"?row.status==="ACTIVE":
          action==="MOVE_TO_DRAFT"?row.status==="DRAFT":
          action==="FEATURE"?row.featured:!row.featured;
        if(unchanged){unchangedIds.push(row.id);continue;}
        const result=await tx.product.updateMany({
          where:{id:row.id,updatedAt:row.updatedAt,status:{not:"ARCHIVED"}},
          data:changes,
        });
        if(result.count!==1)throw new BulkProductConflict();
        // Fixed SQL with bound parameters; audit and edits are atomic.
        await tx.$executeRawUnsafe(
          'INSERT INTO "AdminActivityLog" ("id","adminUserId","action","entityType","entityId","summary","metadata","createdAt") VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,now())',
          randomUUID(),adminUserId,"PRODUCT_BULK_"+action,"PRODUCT",row.id,
          "Bulk "+action+": "+row.name,JSON.stringify({action,count:products.length}),
        );
        changedIds.push(row.id);
      }
      return {action,requested:products.length,changed:changedIds.length,
        unchanged:unchangedIds.length,changedIds,unchangedIds};
    },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable,maxWait:5000,timeout:20000});
  }catch(error){
    if(error&&typeof error==="object"&&"code" in error&&error.code==="P2034")
      throw new BulkProductConflict("Concurrent product edit detected. Refresh and retry.");
    throw error;
  }
}
