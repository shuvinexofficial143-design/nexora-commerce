import { randomUUID } from "node:crypto";
import { getPrisma } from "@/lib/db/prisma";
export async function listCoupons(){return getPrisma().$queryRaw<any[]>`select * from "Coupon" order by "createdAt" desc`}
export async function createCoupon(b:any){
 const id=randomUUID(),code=String(b.code??"").trim().toUpperCase(),kind=String(b.kind??"PERCENT");
 if(code.length<3)throw new Error("Coupon code is required.");
 await getPrisma().$executeRaw`insert into "Coupon"("id","code","kind","value","minSubtotalMinor","maxDiscountMinor","active","createdAt","updatedAt")
 values(${id},${code},${kind},${Number(b.value??0)},${Math.round(Number(b.minSubtotal??0)*100)},${b.maxDiscount?Math.round(Number(b.maxDiscount)*100):null},true,now(),now())`;
 return {id,code};
}
export async function toggleCoupon(id:string,active:boolean){await getPrisma().$executeRaw`update "Coupon" set "active"=${active},"updatedAt"=now() where "id"=${id}`}
