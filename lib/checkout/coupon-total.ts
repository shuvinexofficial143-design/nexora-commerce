export function checkoutTotalWithCoupon(subtotal:number,discountMinor:number){
 const discount=discountMinor/100, taxable=Math.max(0,subtotal-discount), shipping=subtotal===0||subtotal>=999?0:99, tax=Math.round(taxable*.18);
 return {subtotal,discount,shipping,tax,total:taxable+shipping+tax};
}
