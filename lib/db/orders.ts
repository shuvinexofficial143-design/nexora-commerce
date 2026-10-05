import { randomUUID } from "node:crypto";
import { NotFoundError,ValidationError } from "@/lib/db/errors";
import { getPrisma } from "@/lib/db/prisma";
import { resolveCoupon,recordCouponRedemption } from "@/lib/commerce/coupon-engine";
import type { CreateOrderPayload } from "@/types/backend";
const include={items:{include:{product:{select:{id:true,slug:true,name:true,brand:{select:{name:true}},images:{orderBy:{sortOrder:"asc" as const},take:1,select:{url:true,alt:true}}}}}}};
const orderNumber=()=>`NX-${new Date().toISOString().slice(0,10).replaceAll("-","")}-${randomUUID().slice(0,8).toUpperCase()}`;
export async function createOrder(userId:string,input:CreateOrderPayload){
 const p=getPrisma(); if(!input.items?.length)throw new ValidationError("Your cart is empty.");
 const ids=[...new Set(input.items.map(i=>i.productId))];
 const products=await p.product.findMany({where:{id:{in:ids},status:"ACTIVE"},include:{inventory:true}});
 if(products.length!==ids.length)throw new ValidationError("One or more products are unavailable.");
 const map=new Map(products.map(x=>[x.id,x])); let subtotalMinor=0;
 const itemData=input.items.map(i=>{const x=map.get(i.productId);if(!x)throw new ValidationError("Product not found.");
   const available=x.inventory.reduce((s,v)=>s+Math.max(0,v.onHand-v.reserved),0);if(available<i.quantity)throw new ValidationError(`${x.name} does not have enough stock.`);
   const total=x.priceMinor*i.quantity;subtotalMinor+=total;return{productId:x.id,productName:x.name,sku:x.sku,quantity:i.quantity,unitPriceMinor:x.priceMinor,totalMinor:total,variant:i.variant??undefined}});
 const promo=await resolveCoupon(input.coupon,subtotalMinor);if(input.coupon&&!promo.coupon)throw new ValidationError("This coupon is no longer valid for your cart.");
 const discountMinor=promo.discountMinor,taxable=Math.max(0,subtotalMinor-discountMinor),shippingMinor=input.deliveryMethod==="priority"?29900:input.deliveryMethod==="express"?14900:0,taxMinor=Math.round(taxable*.18),totalMinor=taxable+shippingMinor+taxMinor;
 return p.$transaction(async tx=>{const order=await tx.order.create({data:{orderNumber:orderNumber(),userId,subtotalMinor,discountMinor,shippingMinor,taxMinor,totalMinor,paymentMethod:input.paymentMethod??null,shippingAddress:input.shippingAddress,notes:input.notes??null,items:{create:itemData}},include});
   for(const i of input.items){let left=i.quantity;const x=map.get(i.productId)!;for(const s of [...x.inventory].sort((a,b)=>(b.onHand-b.reserved)-(a.onHand-a.reserved))){if(left<=0)break;const q=Math.min(left,Math.max(0,s.onHand-s.reserved));if(q){await tx.inventoryItem.update({where:{id:s.id},data:{reserved:{increment:q}}});await tx.inventoryMovement.create({data:{warehouseId:s.warehouseId,productId:x.id,type:"RESERVE",quantity:q,reference:order.orderNumber}});left-=q}}}
   await recordCouponRedemption(tx,{coupon:promo.coupon,userId,orderId:order.id,discountMinor});return order;});
}
export async function listOrdersForUser(userId:string){return getPrisma().order.findMany({where:{userId},include,orderBy:{createdAt:"desc"},take:50})}
export async function getOrderForUser(userId:string,orderId:string,elevated=false){const o=await getPrisma().order.findFirst({where:elevated?{OR:[{id:orderId},{orderNumber:orderId}]}:{userId,OR:[{id:orderId},{orderNumber:orderId}]},include});if(!o)throw new NotFoundError("Order not found.");return o}
