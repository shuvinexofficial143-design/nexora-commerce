import type { PaymentMethodId } from "@/types/checkout";
export type OrderStatus="Processing"|"Shipped"|"Out for delivery"|"Delivered"|"Cancelled";
export type AccountOrderItem={id:string;lineId:string;slug:string;name:string;brand:string;image:string;price:number;quantity:number;color?:string;size?:string};
export type AccountOrder={id:string;createdAt:string;status:OrderStatus;paymentId:PaymentMethodId;paymentLabel:string;deliveryLabel:string;address:string;email:string;items:AccountOrderItem[];subtotal:number;discount:number;shipping:number;tax:number;total:number;eta:string;trackingNumber:string};
export type ReturnRequest={id:string;orderId:string;reason:string;status:"Requested"|"Pickup scheduled"|"Refund processing"|"Refunded"};
export type WalletTransaction={id:string;label:string;amount:number;date:string};
export type AccountCoupon={code:string;badge:string;title:string;description:string};
export type AccountNotification={id:string;icon:string;title:string;message:string;time:string;read:boolean};
