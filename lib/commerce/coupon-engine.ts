import { randomUUID } from "node:crypto";
import { getPrisma } from "@/lib/db/prisma";

export async function resolveCoupon(code:string|undefined,subtotalMinor:number){
  const c=code?.trim().toUpperCase();
  if(!c)return {coupon:null,discountMinor:0};
  const rows=await getPrisma().$queryRaw<any[]>`
    select * from "Coupon" where "code"=${c} and "active"=true limit 1`;
  const coupon=rows[0];
  if(!coupon)return {coupon:null,discountMinor:0};
  const now=Date.now();
  if(coupon.startsAt&&new Date(coupon.startsAt).getTime()>now)return {coupon:null,discountMinor:0};
  if(coupon.endsAt&&new Date(coupon.endsAt).getTime()<now)return {coupon:null,discountMinor:0};
  if(coupon.usageLimit!==null&&coupon.usageCount>=coupon.usageLimit)return {coupon:null,discountMinor:0};
  if(subtotalMinor<coupon.minSubtotalMinor)return {coupon:null,discountMinor:0};
  let discount=coupon.kind==="PERCENT"?Math.round(subtotalMinor*(coupon.value/100)):coupon.value*100;
  if(coupon.maxDiscountMinor!==null)discount=Math.min(discount,coupon.maxDiscountMinor);
  return {coupon,discountMinor:Math.max(0,Math.min(subtotalMinor,discount))};
}
export async function recordCouponRedemption(tx:any,input:any){
  if(!input.coupon||input.discountMinor<=0)return;
  const exists=await tx.$queryRaw<any[]>`select "id" from "CouponRedemption" where "orderId"=${input.orderId} limit 1`;
  if(exists.length)return;
  await tx.$executeRaw`insert into "CouponRedemption"("id","couponId","userId","orderId","discountMinor","createdAt")
    values(${randomUUID()},${input.coupon.id},${input.userId},${input.orderId},${input.discountMinor},now())`;
  await tx.$executeRaw`update "Coupon" set "usageCount"="usageCount"+1,"updatedAt"=now() where "id"=${input.coupon.id}`;
}
