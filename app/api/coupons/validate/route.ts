import { NextResponse } from "next/server";
import { resolveCoupon } from "@/lib/commerce/coupon-engine";
export const runtime="nodejs";
export async function POST(r:Request){
  try{
    const b=await r.json();
    const x=await resolveCoupon(String(b.code||""),Math.max(0,Math.round(Number(b.subtotal||0)*100)));
    return NextResponse.json({ok:true,data:{valid:Boolean(x.coupon),code:x.coupon?.code??null,discountMinor:x.discountMinor}});
  }catch{return NextResponse.json({ok:false,error:"Could not validate coupon."},{status:400})}
}
