import type { CartLine,CartTotals } from "@/types/cart";
export const FREE_SHIPPING_THRESHOLD=999, GST_RATE=.18;
export const currency=new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0});
export function makeLineId(id: string, color?: string, size?: string, choices?: Record<string,string>) {
  const entries = Object.entries(choices ?? {}).sort(([a], [b]) => a.localeCompare(b));
  return JSON.stringify([id, color || "", size || "", entries]);
}
export function calculateCartDiscount(subtotal:number,couponDiscount=0){return Math.max(0,Math.min(subtotal,couponDiscount))}
export function calculateCartTotals(lines:CartLine[],coupon?:string,couponDiscount=0):CartTotals{const subtotal=lines.reduce((s,l)=>s+l.price*l.quantity,0),itemCount=lines.reduce((s,l)=>s+l.quantity,0),discount=calculateCartDiscount(subtotal,coupon?couponDiscount:0),shipping=subtotal===0||subtotal>=FREE_SHIPPING_THRESHOLD?0:99,tax=Math.round(Math.max(0,subtotal-discount)*GST_RATE);return{subtotal,discount,shipping,tax,total:subtotal-discount+shipping+tax,itemCount}}
export function clampQuantity(v:number){return Math.min(10,Math.max(1,Math.round(v||1)))}
