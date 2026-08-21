import type { CartLine,CartTotals } from "@/types/cart";
export const FREE_SHIPPING_THRESHOLD=999, GST_RATE=.18;
export const currency=new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0});
export function makeLineId(id:string,color?:string,size?:string){return[id,color||"default",size||"default"].join("::")}
export function calculateCartDiscount(subtotal:number,coupon?:string){const c=coupon?.trim().toUpperCase();if(c==="HELLO10")return Math.min(Math.round(subtotal*.1),750);if(c==="SAVE500"&&subtotal>=4999)return 500;return 0}
export function calculateCartTotals(lines:CartLine[],coupon?:string):CartTotals{const subtotal=lines.reduce((s,l)=>s+l.price*l.quantity,0),itemCount=lines.reduce((s,l)=>s+l.quantity,0),discount=calculateCartDiscount(subtotal,coupon),shipping=subtotal===0||subtotal>=FREE_SHIPPING_THRESHOLD?0:99,tax=Math.round(Math.max(0,subtotal-discount)*GST_RATE);return{subtotal,discount,shipping,tax,total:subtotal-discount+shipping+tax,itemCount}}
export function clampQuantity(v:number){return Math.min(10,Math.max(1,Math.round(v||1)))}
