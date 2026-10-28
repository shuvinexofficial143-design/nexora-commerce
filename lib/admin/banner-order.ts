import { Prisma } from "@/generated/prisma/client";
import { getPrisma } from "@/lib/db/prisma";
import { ValidationError } from "@/lib/db/errors";

/** Optimistic, all-or-nothing banner order changes, compatible with Cline's
 * owner endpoint and payload. Archived banners are intentionally not moved.
 */
export class BannerReorderConflict extends Error {
  constructor(message = "Homepage banners changed. Refresh and try reordering again.") {
    super(message);this.name="BannerReorderConflict";
  }
}
export type BannerOrderItem={id:string;updatedAt:string};
const stamp=/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
export function parseBannerReorder(raw:unknown):BannerOrderItem[]{
  if(!raw||typeof raw!=="object"||Array.isArray(raw))
    throw new ValidationError("Invalid banner reorder request.");
  const x=raw as Record<string,unknown>;
  if(Object.keys(x).some(k=>k!=="items")||!Array.isArray(x.items)||
    x.items.length<2||x.items.length>100)
    throw new ValidationError("Select between 2 and 100 non-archived banners.");
  const seen=new Set<string>();
  return x.items.map(value=>{
    if(!value||typeof value!=="object"||Array.isArray(value))
      throw new ValidationError("Invalid banner revision.");
    const item=value as Record<string,unknown>;
    if(Object.keys(item).some(k=>k!=="id"&&k!=="updatedAt")||
      typeof item.id!=="string"||!item.id||item.id.length>128||
      !/^[A-Za-z0-9_-]+$/.test(item.id)||
      typeof item.updatedAt!=="string"||!stamp.test(item.updatedAt)||
      !Number.isFinite(Date.parse(item.updatedAt))||
      new Date(item.updatedAt).toISOString()!==item.updatedAt)
      throw new ValidationError("Invalid banner revision.");
    if(seen.has(item.id))throw new ValidationError("Duplicate banner IDs.");
    seen.add(item.id);
    return {id:item.id,updatedAt:item.updatedAt};
  });
}
export async function reorderHomepageBanners(raw:unknown){
  const items=parseBannerReorder(raw);
  try{
    return await getPrisma().$transaction(async tx=>{
      const current=await tx.homepageBanner.findMany({
        where:{archived:false},select:{id:true,updatedAt:true},
      });
      if(current.length!==items.length)throw new BannerReorderConflict();
      const rows=new Map(current.map(row=>[row.id,row]));
      for(const item of items){
        const row=rows.get(item.id);
        if(!row||row.updatedAt.toISOString()!==item.updatedAt)
          throw new BannerReorderConflict();
      }
      for(let i=0;i<items.length;i++){
        const item=items[i];
        const row=rows.get(item.id)!;
        const result=await tx.homepageBanner.updateMany({
          where:{id:item.id,updatedAt:row.updatedAt,archived:false},
          data:{sortOrder:i},
        });
        if(result.count!==1)throw new BannerReorderConflict();
      }
      return {reordered:items.length};
    },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable,maxWait:5000,timeout:20000});
  }catch(error){
    if(error&&typeof error==="object"&&"code" in error&&error.code==="P2034")
      throw new BannerReorderConflict("Concurrent homepage banner update detected. Refresh and retry.");
    throw error;
  }
}
