import { Prisma, type AttributeType, type Prisma as PrismaType } from "@/generated/prisma/client";
import { ValidationError, ConflictError } from "@/lib/db/errors";
import { getPrisma } from "@/lib/db/prisma";
import { isSupportedPosterUrl } from "@/lib/product-media";

type Definition = {
  slug:string; name:string; type:AttributeType; required:boolean; active:boolean;
  options:unknown; sortOrder?:number;
};
export const attributeTypes = [
  "TEXT","NUMBER","SELECT","MULTI_SELECT","BOOLEAN","COLOR","DATE","IMAGE_REQUEST",
] as const;
type AttributeTypeValue=typeof attributeTypes[number];
const slugPattern=/^[a-z0-9][a-z0-9-]{0,63}$/;
const cleaned=(name:string)=>name.toLowerCase().replace(/&/g," and ")
  .replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
export function validateAttributeDefinition(raw:unknown){
  if(!raw||typeof raw!=="object"||Array.isArray(raw))
    throw new ValidationError("Invalid attribute definition.");
  const x=raw as Record<string,unknown>;
  if(typeof x.categoryId!=="string"||!x.categoryId||x.categoryId.length>128)
    throw new ValidationError("Choose a category.");
  if(typeof x.name!=="string"||x.name.trim().length<2||x.name.trim().length>80)
    throw new ValidationError("Attribute name must be 2–80 characters.");
  const name=x.name.trim();
  const slug=cleaned(name);
  if(!slugPattern.test(slug))throw new ValidationError("Invalid attribute name.");
  const type=(x.type??"TEXT") as AttributeTypeValue;
  if(!attributeTypes.includes(type))throw new ValidationError("Unsupported attribute type.");
  if(x.required!==undefined&&typeof x.required!=="boolean")
    throw new ValidationError("Required must be true or false.");
  if(x.active!==undefined&&typeof x.active!=="boolean")
    throw new ValidationError("Active must be true or false.");
  const sortOrder=x.sortOrder??0;
  if(!Number.isInteger(sortOrder)||Number(sortOrder)<0||Number(sortOrder)>1000)
    throw new ValidationError("Invalid attribute sort order.");
  const options=x.options===undefined?[]:x.options;
  if(!Array.isArray(options)||options.length>40||
     options.some(v=>typeof v!=="string"||v.trim().length<1||v.trim().length>80))
    throw new ValidationError("Options must be 1–40 short values.");
  const values=[...new Set((options as string[]).map(v=>v.trim()))];
  if(["SELECT","MULTI_SELECT","COLOR"].includes(type)&&!values.length)
    throw new ValidationError("Choose allowed values for selection attribute.");
  if(!["SELECT","MULTI_SELECT","COLOR"].includes(type)&&values.length)
    throw new ValidationError("This attribute type cannot have selection options.");
  return {categoryId:x.categoryId,name,slug,type,options:values,
    required:x.required===true,active:x.active!==false,sortOrder:Number(sortOrder)};
}
function isPlain(value:unknown):value is Record<string,unknown>{
  return !!value&&typeof value==="object"&&!Array.isArray(value)&&
    Object.getPrototypeOf(value)===Object.prototype;
}
function isISODate(value:string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) &&
    new Date(value).toISOString().slice(0,10)===value;
}
/** Strictly strip unknown/inactive keys and avoid persisting malformed specs.
 * Required attributes are enforced on product ACTIVATION, not partial DRAFTS.
 */
export function validateProductAttributes(definitions:readonly Definition[],raw:unknown,
  enforceRequired:boolean):Record<string,unknown>{
  if(!isPlain(raw))throw new ValidationError("Product attributes must be a keyed object.");
  if(Object.keys(raw).length>60||JSON.stringify(raw).length>12000)
    throw new ValidationError("Too many product attributes.");
  const known=new Map(definitions.filter(d=>d.active).map(d=>[d.slug,d]));
  for(const key of Object.keys(raw)){
    if(!known.has(key)||key==="__proto__"||key==="constructor")
      throw new ValidationError("Attribute "+key+" is not defined for this category.");
  }
  const result:Record<string,unknown>={};
  for(const def of definitions.filter(d=>d.active)){
    const rawValue=raw[def.slug];
    const empty=rawValue===undefined||rawValue===null||rawValue===""||
      (Array.isArray(rawValue)&&rawValue.length===0);
    if(empty){
      if(enforceRequired&&def.required)
        throw new ValidationError(def.name+" is required before publishing.");
      continue;
    }
    const allowed=Array.isArray(def.options)?def.options.filter((v):v is string=>typeof v==="string"):[];
    let value:unknown=rawValue;
    switch(def.type){
      case "TEXT":
        if(typeof value!=="string"||!value.trim()||value.length>1000)
          throw new ValidationError(def.name+" must be text under 1000 characters.");
        value=value.trim();
        break;
      case "NUMBER":
        if(typeof value!=="number"||!Number.isFinite(value)||Math.abs(value)>1e12)
          throw new ValidationError(def.name+" must be a finite number.");
        break;
      case "BOOLEAN":
        if(typeof value!=="boolean")throw new ValidationError(def.name+" must be yes or no.");
        break;
      case "SELECT":case "COLOR":
        if(typeof value!=="string"||!allowed.includes(value))
          throw new ValidationError(def.name+" must be an allowed option.");
        break;
      case "MULTI_SELECT":
        if(!Array.isArray(value)||value.length>20||
          value.some(v=>typeof v!=="string"||!allowed.includes(v))||
          new Set(value).size!==value.length)
          throw new ValidationError(def.name+" includes invalid options.");
        break;
      case "DATE":
        if(typeof value!=="string"||!isISODate(value))
          throw new ValidationError(def.name+" must be a valid ISO date.");
        break;
      case "IMAGE_REQUEST":
        if(typeof value!=="string"||value.length>1000||!isSupportedPosterUrl(value))
          throw new ValidationError(def.name+" needs an approved HTTPS image URL.");
        break;
      default:throw new ValidationError("Unsupported product attribute.");
    }
    result[def.slug]=value;
  }
  return result;
}
export async function listAttributeDefinitions(categoryId?:string){
  return getPrisma().attributeDefinition.findMany({
    where:categoryId?{categoryId}:undefined,
    orderBy:[{categoryId:"asc"},{sortOrder:"asc"},{name:"asc"}],take:500,
  });
}
export async function createAttributeDefinition(raw:unknown){
  const data=validateAttributeDefinition(raw);
  const db=getPrisma();
  const cat=await db.category.findUnique({where:{id:data.categoryId},select:{id:true,archived:true}});
  if(!cat||cat.archived)throw new ValidationError("Category is unavailable.");
  try{
    return await db.attributeDefinition.create({
      data:{...data,options:data.options as Prisma.InputJsonValue},
    });
  }catch(error){
    if(error&&typeof error==="object"&&"code" in error&&error.code==="P2002")
      throw new ConflictError("An attribute with this name already exists in the category.");
    throw error;
  }
}
export function validateAttributeStateChange(raw:unknown){
  if(!isPlain(raw)||typeof raw.id!=="string"||raw.id.length>128||!raw.id||
    Object.keys(raw).some(k=>!["id","active"].includes(k))||
    typeof raw.active!=="boolean")
    throw new ValidationError("Only an attribute's active state may be updated.");
  return {id:raw.id,active:raw.active};
}
export async function setAttributeState(raw:unknown){
  const data=validateAttributeStateChange(raw);
  return getPrisma().attributeDefinition.update({where:{id:data.id},data:{active:data.active}});
}
/** Full category-scoped definition set; caller runs inside product write transaction. */
export async function attributesForCategory(tx:PrismaType.TransactionClient,categoryId:string){
  return tx.attributeDefinition.findMany({where:{categoryId},
    orderBy:[{sortOrder:"asc"},{name:"asc"}]});
}
export function publicSpecifications(
  definitions:readonly Definition[],attributes:unknown
):Array<{label:string;value:string}>{
  if(!isPlain(attributes))return [];
  const result:Array<{label:string;value:string}>=[];
  for(const def of definitions.filter(d=>d.active).sort((a,b)=>(a.sortOrder??0)-(b.sortOrder??0))){
    const v=attributes[def.slug];if(v===undefined||v===null)continue;
    let value:string;
    if(typeof v==="string"||typeof v==="number")value=String(v);
    else if(typeof v==="boolean")value=v?"Yes":"No";
    else if(Array.isArray(v)&&v.every(x=>typeof x==="string"))value=v.join(", ");
    else continue;
    if(!value||value.length>400)continue;
    if(def.type==="IMAGE_REQUEST")continue; // Never render arbitrary URL as plain specification.
    result.push({label:def.name,value});
  }
  return result.slice(0,50);
}
