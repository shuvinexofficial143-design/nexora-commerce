export async function validateCoupon(code:string,subtotal:number){
  const r=await fetch("/api/coupons/validate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({code,subtotal})});
  const p=await r.json(); if(!r.ok||!p.ok)throw new Error(p.error||"Coupon validation failed.");
  return p.data as {valid:boolean;code:string|null;discountMinor:number};
}
