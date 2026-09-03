import type { AccountNotification, AccountOrder, AccountCoupon, WalletTransaction } from "@/types/account";

const ORDER_KEY="prakriti-ganesh-orders-v1";

export const demoOrders: AccountOrder[]=[
  {
    id:"PG82401931",createdAt:"2026-08-18T10:30:00.000Z",status:"Shipped",paymentId:"upi",paymentLabel:"UPI",deliveryLabel:"Festival express delivery",
    address:"42 Mahakal Road, Ujjain, Madhya Pradesh 456001, India",email:"customer@prakritiganesh.demo",
    items:[{id:"cat_001",lineId:"cat_001-natural",slug:"shree-shadu-ganesh-12",name:"Shree Shadu Ganesh — 12 inch",brand:"Prakriti Studio",image:"🪔",price:1499,quantity:1,color:"Natural Clay",size:"12 inch"}],
    subtotal:1499,discount:150,shipping:149,tax:270,total:1768,eta:"22 Aug",trackingNumber:"PGTRK882041"
  },
  {
    id:"PG67210455",createdAt:"2026-08-08T08:10:00.000Z",status:"Delivered",paymentId:"card",paymentLabel:"Card",deliveryLabel:"Careful standard delivery",
    address:"18 Freeganj, Ujjain, Madhya Pradesh 456010, India",email:"customer@prakritiganesh.demo",
    items:[{id:"cat_002",lineId:"cat_002-natural",slug:"bal-ganesh-home-8",name:"Bal Ganesh Home Murti — 8 inch",brand:"Prakriti Studio",image:"🌿",price:899,quantity:1,color:"Natural",size:"8 inch"}],
    subtotal:899,discount:0,shipping:99,tax:180,total:1178,eta:"Delivered 11 Aug",trackingNumber:"PGTRK421966"
  }
];

export function readOrders():AccountOrder[]{
  if(typeof window==="undefined")return demoOrders;
  try{
    const raw=localStorage.getItem(ORDER_KEY);
    if(!raw){localStorage.setItem(ORDER_KEY,JSON.stringify(demoOrders));return demoOrders}
    const parsed=JSON.parse(raw);
    return Array.isArray(parsed)?parsed:demoOrders
  }catch{return demoOrders}
}

export function addOrder(order:AccountOrder){
  if(typeof window==="undefined")return;
  const current=readOrders().filter(o=>o.id!==order.id);
  localStorage.setItem(ORDER_KEY,JSON.stringify([order,...current]));
}

export const walletTransactions:WalletTransaction[]=[
  {id:"w1",label:"Festival welcome reward",amount:500,date:"20 Aug 2026"},
  {id:"w2",label:"Eco purchase cashback",amount:250,date:"18 Aug 2026"},
  {id:"w3",label:"Wallet used on order",amount:-300,date:"08 Aug 2026"},
  {id:"w4",label:"Referral reward",amount:800,date:"01 Aug 2026"}
];

export const accountCoupons:AccountCoupon[]=[
  {code:"GANESH10",badge:"Festival welcome",title:"10% off your next murti",description:"Up to ₹750 off on eligible eco-friendly Ganesh murtis."},
  {code:"ECO500",badge:"Big order",title:"Flat ₹500 off",description:"Valid on eligible orders of ₹4,999 or more."},
  {code:"BULK10",badge:"Society orders",title:"Bulk order benefit",description:"Special pricing support for eligible society and community orders."},
  {code:"FREESHIP",badge:"Delivery",title:"Protected delivery offer",description:"Available on selected sizes and serviceable pincodes."}
];

export const notificationSeed:AccountNotification[]=[
  {id:"n1",icon:"📦",title:"Your murti has shipped",message:"PG82401931 is moving through the delivery network with protective packing.",time:"18 min ago",read:false},
  {id:"n2",icon:"🌿",title:"Eco collection update",message:"A saved Shadu Mati murti is available again.",time:"2 hours ago",read:false},
  {id:"n3",icon:"💳",title:"Wallet reward added",message:"₹250 eco purchase cashback was credited to your Prakriti Wallet.",time:"Yesterday",read:true},
  {id:"n4",icon:"❤️",title:"Wishlist stock update",message:"A Ganesh murti from your wishlist is back in stock.",time:"2 days ago",read:true}
];
