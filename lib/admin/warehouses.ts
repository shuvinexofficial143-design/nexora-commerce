import { randomUUID } from "node:crypto"; import { getPrisma } from "@/lib/db/prisma";
export async function listWarehouses(){return getPrisma().warehouse.findMany({orderBy:{createdAt:"desc"},include:{_count:{select:{inventory:true}}}})}
export async function createWarehouse(b:any){return getPrisma().warehouse.create({data:{id:randomUUID(),code:String(b.code).trim().toUpperCase(),name:String(b.name).trim(),city:String(b.city).trim(),state:String(b.state).trim(),active:true}})}
export async function toggleWarehouse(id:string,active:boolean){return getPrisma().warehouse.update({where:{id},data:{active}})}
