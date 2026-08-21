"use client";
export function CouponStatus({code,valid,discountMinor}:{code:string;valid:boolean;discountMinor:number}){
 if(!code)return null;
 return <p className={`mt-2 text-xs font-bold ${valid?"text-green-700":"text-red-700"}`}>
   {valid?`${code} applied · ₹${(discountMinor/100).toFixed(0)} off`:"Coupon is not valid for this cart."}
 </p>;
}
