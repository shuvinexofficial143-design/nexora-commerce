import { ValidationError } from "@/lib/db/errors";
import { isSupportedPosterUrl } from "@/lib/product-media";
export type MetadataKind="category"|"brand";
export function parseCatalogMetadata(kind:MetadataKind,raw:Record<string,unknown>){
  const result:{description?:string|null;imageUrl?:string|null;logoUrl?:string|null}={};
  if("description" in raw){
    const value=raw.description;
    if(value===null||value==="")result.description=null;
    else if(typeof value!=="string"||value.trim().length>500)
      throw new ValidationError("Description must be at most 500 characters.");
    else result.description=value.trim()||null;
  }
  const imageField=kind==="category"?"imageUrl":"logoUrl";
  if(imageField in raw){
    const value=raw[imageField];
    if(value===null||value==="")result[imageField]=null;
    else if(typeof value!=="string"||value.length>1000||!isSupportedPosterUrl(value.trim()))
      throw new ValidationError("Catalog image must use an approved HTTPS image URL.");
    else result[imageField]=value.trim();
  }
  return result;
}
