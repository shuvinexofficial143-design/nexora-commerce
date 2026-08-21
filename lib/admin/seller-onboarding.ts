import { randomUUID } from "node:crypto";
import { getPrisma } from "@/lib/db/prisma";
import { hashPassword } from "@/lib/auth/password";
export async function onboardSeller(b:any){
  const email=String(b.email||"").trim().toLowerCase(),name=String(b.name||"").trim(),store=String(b.storeName||"").trim();
  if(!email||!name||!store)throw new Error("Seller name, email and store are required.");
  const p=getPrisma(); if(await p.user.findUnique({where:{email}}))throw new Error("Email already exists.");
  const password=String(b.password||"NexoraSeller@123");
  return p.$transaction(async tx=>{
    const user=await tx.user.create({data:{id:randomUUID(),email,name,passwordHash:await hashPassword(password),role:"SELLER",status:"ACTIVE"}});
    const profileId=randomUUID();
    await tx.$executeRaw`insert into "SellerProfile"("id","userId","storeName","gstNumber","commissionBps","verificationStatus","payoutStatus","createdAt","updatedAt")
      values(${profileId},${user.id},${store},${b.gstNumber||null},${Number(b.commissionBps||1000)},"PENDING","HOLD",now(),now())`;
    return {userId:user.id,profileId,email,password};
  });
}
