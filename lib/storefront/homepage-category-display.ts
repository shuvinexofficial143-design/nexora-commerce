import { getPrisma } from "@/lib/db/prisma";
import { eligiblePublicCategoryIds,publicProductVisibilityWhere } from "@/lib/commerce/catalog-visibility";
import { isSupportedPosterUrl } from "@/lib/product-media";
import type { HomepageCollection } from "@/lib/storefront/homepage-collection";

export type HomepageCategoryDisplay={slug:string;name:string;imageUrl:string|null;sortOrder:number};
export function applyHomepageCategoryDisplay(
  collection:HomepageCollection,metadata:readonly HomepageCategoryDisplay[],
):HomepageCollection{
  const bySlug=new Map(metadata.map(m=>[m.slug,m]));
  return {...collection,categories:collection.categories.map(cat=>{
    const info=bySlug.get(cat.slug);
    if(!info)return cat;
    return {...cat,name:info.name.trim()||cat.name,
      image:info.imageUrl && isSupportedPosterUrl(info.imageUrl)?info.imageUrl:cat.image,
    };
  }).sort((a,b)=>{
    const orderA=bySlug.get(a.slug)?.sortOrder??1000;
    const orderB=bySlug.get(b.slug)?.sortOrder??1000;
    return orderA-orderB || b.productCount-a.productCount || a.slug.localeCompare(b.slug);
  })};
}
export async function listHomepageCategoryDisplay():Promise<HomepageCategoryDisplay[]>{
  const db=getPrisma();
  const eligible=await eligiblePublicCategoryIds(db);
  if(!eligible.length)return [];
  return db.category.findMany({
    where:{id:{in:eligible},products:{some:{
      status:"ACTIVE",AND:[publicProductVisibilityWhere(eligible)],
    }}},
    select:{slug:true,name:true,imageUrl:true,sortOrder:true},
    orderBy:[{sortOrder:"asc"},{name:"asc"}],take:100,
  });
}
