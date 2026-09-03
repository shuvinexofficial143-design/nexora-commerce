import type { CheckoutAddress, DeliveryOption, PaymentMethod } from "@/types/checkout";

export const defaultAddresses: CheckoutAddress[] = [
  { id:"home", label:"Home", fullName:"Prakriti Customer", phone:"9876543210", alternatePhone:"", line1:"42 Mahakal Road", areaColony:"Mahakal Marg", landmark:"Near Mahakaleshwar area", city:"Ujjain", state:"Madhya Pradesh", postalCode:"456001", country:"India" },
];

export const deliveryOptions: DeliveryOption[] = [
  { id:"standard", label:"Careful standard delivery", eta:"Protective packing · estimated 3–5 business days", price:0, badge:"Free" },
  { id:"express", label:"Festival priority delivery", eta:"Priority packing · estimated 1–2 business days where available", price:99, badge:"Faster" },
];

export const paymentMethods: PaymentMethod[] = [
  { id:"cod", label:"Cash on Delivery", description:"Available on all Ganesh murtis in this collection", icon:"📦" },
  { id:"upi", label:"UPI", description:"Google Pay, PhonePe, Paytm & other UPI apps", icon:"⚡" },
  { id:"card", label:"Credit / Debit Card", description:"Secure online card payment option", icon:"💳" },
];
