export type SellerOrderStatus = "New" | "Processing" | "Packed" | "Shipped" | "Delivered" | "Cancelled";
export type SellerProductStatus = "Live" | "Draft" | "Paused";
export type SellerInventoryStatus = "Healthy" | "Low" | "Critical" | "Out";
export type SellerPayoutStatus = "Scheduled" | "Processing" | "Paid";
export type SellerProduct = { id:string; sku:string; name:string; category:string; price:number; stock:number; sold:number; rating:number; status:SellerProductStatus };
export type SellerOrder = { id:string; customer:string; product:string; quantity:number; amount:number; placed:string; status:SellerOrderStatus };
export type SellerInventory = { sku:string; product:string; onHand:number; reserved:number; available:number; reorderAt:number; status:SellerInventoryStatus };
export type SellerPayout = { id:string; period:string; gross:number; commission:number; deductions:number; net:number; eta:string; status:SellerPayoutStatus };
export type SellerReview = { id:string; customer:string; product:string; rating:number; comment:string; date:string; verified:boolean; replied:boolean };
export type SellerKpi = { label:string; value:string; detail:string; trend:string };
export type SellerProfile = { businessName:string; ownerName:string; email:string; phone:string; gstin:string; category:string; pickupCity:string; bankLabel:string; supportEmail:string };


export type SellerAccountProfile = {
  profileId: string | null;
  userId: string;
  storeName: string;
  ownerName: string;
  email: string;
  phone: string;
  gstNumber: string;
  verificationStatus: string;
  payoutStatus: string;
  commissionBps: number;
};
