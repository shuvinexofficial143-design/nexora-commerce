import type {AdminBulkEnquiry,AdminCoupon,AdminCustomer,AdminKpi,AdminOrder,AdminProduct,AdminReturn,AdminReview,OrderStatusSummary,RevenuePoint} from "@/types/admin";

export const adminKpis:AdminKpi[]=[
  {label:"Festival revenue",value:"₹8.74L",trend:22.6,icon:"₹"},
  {label:"Murti orders",value:"486",trend:18.9,icon:"🪔"},
  {label:"Bulk enquiries",value:"37",trend:31.4,icon:"🏛"},
  {label:"Eco conversion",value:"6.42%",trend:1.8,icon:"🌿"},
];

export const revenueSeries:RevenuePoint[]=[
  {label:"Mon",revenue:74000},{label:"Tue",revenue:92000},{label:"Wed",revenue:118000},{label:"Thu",revenue:126000},{label:"Fri",revenue:148000},{label:"Sat",revenue:169000},{label:"Sun",revenue:147000},
];

export const orderStatusSummary:OrderStatusSummary[]=[
  {label:"Processing",count:54},{label:"Packed",count:46},{label:"Shipped",count:82},{label:"Delivered",count:292},{label:"Returned",count:12},
];

export const recentOrders:AdminOrder[]=[
  {id:"PG82401931",customer:"Aarav Sharma",date:"03 Sep · 5:14 PM",items:1,payment:"UPI",total:1768,status:"Shipped"},
  {id:"PG82401930",customer:"Meera Patel",date:"03 Sep · 4:52 PM",items:2,payment:"Card",total:2598,status:"Packed"},
  {id:"PG82401929",customer:"Rohan Verma",date:"03 Sep · 4:31 PM",items:1,payment:"COD",total:3499,status:"Processing"},
  {id:"PG82401928",customer:"Ishita Jain",date:"03 Sep · 3:58 PM",items:3,payment:"UPI",total:3297,status:"Delivered"},
  {id:"PG82401927",customer:"Kabir Khan",date:"03 Sep · 3:22 PM",items:1,payment:"Card",total:4799,status:"Shipped"},
  {id:"PG82401926",customer:"Ananya Singh",date:"03 Sep · 2:47 PM",items:1,payment:"UPI",total:899,status:"Returned"},
];

export const adminProducts:AdminProduct[]=[
  {sku:"PG-00001",name:"Shree Shadu Ganesh — 12 inch",image:"🪔",category:"Shadu Mati",price:1499,stock:38,sales:184,active:true},
  {sku:"PG-00002",name:"Bal Ganesh Home Murti — 8 inch",image:"🌿",category:"Home Murtis",price:899,stock:52,sales:126,active:true},
  {sku:"PG-00003",name:"Vriksha Seed Ganesh — 10 inch",image:"🌱",category:"Seed Ganesh",price:1299,stock:27,sales:92,active:true},
  {sku:"PG-00004",name:"Rajadhiraj Premium Ganesh — 18 inch",image:"👑",category:"Premium",price:3499,stock:7,sales:78,active:true},
  {sku:"PG-00011",name:"Vakratunda Premium Ganesh — 21 inch",image:"✨",category:"Premium",price:4799,stock:4,sales:56,active:true},
  {sku:"PG-00017",name:"Mandal Eco Ganesh — 30 inch",image:"🏛",category:"Bulk Orders",price:7999,stock:3,sales:24,active:true},
];

export const adminCustomers:AdminCustomer[]=[
  {name:"Aarav Sharma",email:"aarav@example.com",segment:"Festival repeat",orders:4,ltv:8240,lastOrder:"Today",status:"Active"},
  {name:"Meera Patel",email:"meera@example.com",segment:"Eco loyal",orders:3,ltv:6490,lastOrder:"Today",status:"Active"},
  {name:"Rohan Verma",email:"rohan@example.com",segment:"New",orders:1,ltv:3499,lastOrder:"Today",status:"Active"},
  {name:"Ishita Jain",email:"ishita@example.com",segment:"Gifting",orders:5,ltv:11840,lastOrder:"1 day ago",status:"Active"},
  {name:"Kabir Khan",email:"kabir@example.com",segment:"Premium",orders:2,ltv:8298,lastOrder:"3 days ago",status:"Active"},
];

export const categorySummary=[
  {name:"Shadu Mati",products:4,revenue:244800},{name:"Home Murtis",products:3,revenue:148600},{name:"Seed Ganesh",products:3,revenue:126900},{name:"Premium",products:3,revenue:252400},{name:"Bulk Orders",products:3,revenue:101300},{name:"Natural Finish",products:2,revenue:67400},
];
export const brandSummary=[{name:"Prakriti Studio",share:44},{name:"Prakriti Earth",share:31},{name:"Prakriti Artisan",share:25}];

export const adminCoupons:AdminCoupon[]=[
  {code:"GANESH10",type:"Festival welcome",offer:"10% off up to ₹750",uses:248,revenue:282400,ends:"15 Sep",active:true},
  {code:"ECO500",type:"High value",offer:"₹500 off above ₹4,999",uses:64,revenue:424800,ends:"12 Sep",active:true},
  {code:"BULK10",type:"Society orders",offer:"Special bulk pricing",uses:18,revenue:318600,ends:"30 Sep",active:true},
  {code:"FREESHIP",type:"Delivery",offer:"Protected delivery benefit",uses:90,revenue:126900,ends:"—",active:false},
];

export const adminReviews:AdminReview[]=[
  {id:"PG-RV-1048",product:"Shree Shadu Ganesh — 12 inch",customer:"Aarav Sharma",rating:5,status:"Published",text:"Natural clay finish looked beautiful and the protective packing was excellent."},
  {id:"PG-RV-1047",product:"Vriksha Seed Ganesh — 10 inch",customer:"Meera Patel",rating:5,status:"Published",text:"Loved the plantable concept and earthy finish. Perfect for our home celebration."},
  {id:"PG-RV-1046",product:"Rajadhiraj Premium Ganesh — 18 inch",customer:"Dev Malhotra",rating:3,status:"Needs review",text:"Murti was beautiful but outer packaging arrived slightly dented."},
];

export const adminReturns:AdminReturn[]=[
  {id:"PG-RT-2081",orderId:"PG82401926",customer:"Ananya Singh",reason:"Transit damage",amount:899,status:"Replacement arranged"},
  {id:"PG-RT-2080",orderId:"PG82399812",customer:"Vivan Shah",reason:"Finish variation",amount:1599,status:"Photo review pending"},
  {id:"PG-RT-2079",orderId:"PG82398440",customer:"Riya Soni",reason:"Delivery timing",amount:1199,status:"Refund approved"},
];

export const bulkEnquiries:AdminBulkEnquiry[]=[
  {id:"BE-2401",name:"Rahul Joshi",organization:"Mahakal Residency",phone:"+91 98••• 4210",city:"Ujjain",size:"24–30 inch",quantity:2,budget:"₹12k–₹18k",neededBy:"12 Sep",status:"New"},
  {id:"BE-2400",name:"Neha Patil",organization:"Aarambh Tech",phone:"+91 97••• 8321",city:"Indore",size:"Gifting minis",quantity:60,budget:"₹25k–₹35k",neededBy:"10 Sep",status:"Contacted"},
  {id:"BE-2399",name:"Vikas Mehta",organization:"Shree Ganesh Mandal",phone:"+91 99••• 1608",city:"Dewas",size:"30+ inch",quantity:1,budget:"₹8k–₹12k",neededBy:"11 Sep",status:"Quoted"},
  {id:"BE-2398",name:"Priya Jain",organization:"Green Park Society",phone:"+91 96••• 5580",city:"Bhopal",size:"18–24 inch",quantity:4,budget:"₹18k–₹24k",neededBy:"13 Sep",status:"Confirmed"},
];

export const analyticsFunnel=[
  {label:"Store sessions",value:18420,percent:100},{label:"Murti views",value:12680,percent:69},{label:"Added to cart",value:3240,percent:26},{label:"Checkout started",value:1680,percent:13},{label:"Orders placed",value:486,percent:6},
];
export const trafficSources=[
  {name:"Organic search",sessions:6240,share:34},{name:"Instagram & social",sessions:5180,share:28},{name:"Direct",sessions:3640,share:20},{name:"WhatsApp referrals",sessions:2180,share:12},{name:"Other referrals",sessions:1180,share:6},
];
