import type {SellerInventory,SellerKpi,SellerOrder,SellerPayout,SellerProduct,SellerProfile,SellerReview} from "@/types/seller";
export const sellerKpis:SellerKpi[]=[
 {label:"Gross sales",value:"₹18.42L",detail:"This month",trend:"+18.6%"},
 {label:"Orders",value:"1,248",detail:"92 open now",trend:"+12.4%"},
 {label:"Conversion",value:"5.8%",detail:"Store visitors",trend:"+0.7 pt"},
 {label:"Seller rating",value:"4.8/5",detail:"2,916 ratings",trend:"Top 8%"},
];
export const sellerProducts:SellerProduct[]=[
 {id:"PR-4101",sku:"NX-SHO-101",name:"Aero Run Pro Sneakers",category:"Footwear",price:3299,stock:42,sold:684,rating:4.8,status:"Live"},
 {id:"PR-4102",sku:"NX-SHO-102",name:"Aero Street Flex",category:"Footwear",price:2799,stock:18,sold:412,rating:4.6,status:"Live"},
 {id:"PR-4103",sku:"NX-SHO-103",name:"Aero Trail One",category:"Footwear",price:3899,stock:9,sold:206,rating:4.7,status:"Live"},
 {id:"PR-4104",sku:"NX-SHO-104",name:"Aero Daily Move",category:"Footwear",price:2199,stock:0,sold:96,rating:4.4,status:"Paused"},
 {id:"PR-4105",sku:"NX-SHO-105",name:"Aero Cloud Lite",category:"Footwear",price:3499,stock:64,sold:0,rating:0,status:"Draft"},
];
export const sellerOrders:SellerOrder[]=[
 {id:"NX-84219",customer:"Riya Mehta",product:"Aero Run Pro Sneakers",quantity:1,amount:3299,placed:"Today · 7:42 PM",status:"New"},
 {id:"NX-84211",customer:"Ankit Jain",product:"Aero Street Flex",quantity:2,amount:5598,placed:"Today · 6:18 PM",status:"Processing"},
 {id:"NX-84196",customer:"Sana Khan",product:"Aero Trail One",quantity:1,amount:3899,placed:"Today · 4:52 PM",status:"Packed"},
 {id:"NX-84174",customer:"Dev Patel",product:"Aero Run Pro Sneakers",quantity:1,amount:3299,placed:"Today · 2:37 PM",status:"Shipped"},
 {id:"NX-84088",customer:"Aarav Sharma",product:"Aero Street Flex",quantity:1,amount:2799,placed:"Yesterday",status:"Delivered"},
];
export const sellerInventory:SellerInventory[]=[
 {sku:"NX-SHO-101",product:"Aero Run Pro Sneakers",onHand:58,reserved:16,available:42,reorderAt:20,status:"Healthy"},
 {sku:"NX-SHO-102",product:"Aero Street Flex",onHand:29,reserved:11,available:18,reorderAt:20,status:"Low"},
 {sku:"NX-SHO-103",product:"Aero Trail One",onHand:17,reserved:8,available:9,reorderAt:18,status:"Critical"},
 {sku:"NX-SHO-104",product:"Aero Daily Move",onHand:0,reserved:0,available:0,reorderAt:25,status:"Out"},
 {sku:"NX-SHO-105",product:"Aero Cloud Lite",onHand:64,reserved:0,available:64,reorderAt:20,status:"Healthy"},
];
export const sellerPayouts:SellerPayout[]=[
 {id:"PO-8840",period:"10–16 Aug",gross:364800,commission:43776,deductions:0,net:321024,eta:"22 Aug",status:"Processing"},
 {id:"PO-8814",period:"3–9 Aug",gross:318200,commission:38184,deductions:1200,net:278816,eta:"15 Aug",status:"Paid"},
 {id:"PO-8788",period:"27 Jul–2 Aug",gross:292400,commission:35088,deductions:0,net:257312,eta:"8 Aug",status:"Paid"},
 {id:"PO-8761",period:"20–26 Jul",gross:268900,commission:32268,deductions:850,net:235782,eta:"1 Aug",status:"Paid"},
];
export const sellerReviews:SellerReview[]=[
 {id:"RV-610",customer:"Ishita P.",product:"Aero Run Pro Sneakers",rating:5,comment:"Very comfortable for long walks and the fit is accurate.",date:"Today",verified:true,replied:false},
 {id:"RV-609",customer:"Mohit K.",product:"Aero Street Flex",rating:4,comment:"Good cushioning. Packaging could be better.",date:"Yesterday",verified:true,replied:true},
 {id:"RV-608",customer:"Naina S.",product:"Aero Trail One",rating:5,comment:"Grip is excellent and it feels lighter than expected.",date:"18 Aug",verified:true,replied:false},
 {id:"RV-607",customer:"Rahul V.",product:"Aero Daily Move",rating:3,comment:"Nice design but my size was unavailable for exchange.",date:"17 Aug",verified:true,replied:true},
];
export const sellerSalesSeries=[
 {day:"Mon",sales:42800,orders:118},{day:"Tue",sales:51600,orders:142},{day:"Wed",sales:47200,orders:131},{day:"Thu",sales:63800,orders:176},{day:"Fri",sales:71400,orders:198},{day:"Sat",sales:86600,orders:236},{day:"Sun",sales:79800,orders:219},
];
export const sellerProfile:SellerProfile={businessName:"Aero India",ownerName:"Kabir Malhotra",email:"seller@aeroindia.in",phone:"+91 98765 43210",gstin:"23ABCDE1234F1Z5",category:"Footwear",pickupCity:"Indore, Madhya Pradesh",bankLabel:"HDFC Bank •••• 9302",supportEmail:"support@aeroindia.in"};
