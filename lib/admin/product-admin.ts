import { randomUUID } from "node:crypto";
import { getPrisma } from "@/lib/db/prisma";
const slug=(s:string)=>s.toLowerCase().trim().replace(/&/g,"and").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
export async function createProduct(b:any){
  const name=String(b.name??"").trim(),sku=String(b.sku??"").trim().toUpperCase(),price=Number(b.price);
  if(name.length<2||sku.length<3||!Number.isFinite(price)||price<0)throw new Error("Invalid Ganesh murti details.");
  return getPrisma().product.create({data:{id:randomUUID(),slug:`${slug(name)}-${randomUUID().slice(0,6)}`,sku,name,
    description:String(b.description??`${name} on Prakriti Ganesh`),priceMinor:Math.round(price*100),status:b.status==="ACTIVE"?"ACTIVE":"DRAFT"}});
}
export async function updateProduct(id:string,b:any){
  const data:any={};
  if(typeof b.name==="string")data.name=b.name.trim();
  if(typeof b.price==="number")data.priceMinor=Math.round(b.price*100);
  if(["DRAFT","ACTIVE","ARCHIVED"].includes(b.status))data.status=b.status;
  if(typeof b.featured==="boolean")data.featured=b.featured;
  return getPrisma().product.update({where:{id},data});
}
