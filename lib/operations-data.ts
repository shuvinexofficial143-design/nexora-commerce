import type {Campaign,InventoryItem,Payout,Seller,SellerApplication,StockAlert,StockMovement,Warehouse} from "@/types/operations";

export const inventoryItems:InventoryItem[]=[
 {sku:"PG-00001",name:"Shree Shadu Ganesh — 12 inch",category:"Shadu Mati",onHand:44,reserved:6,available:38,reorderAt:16,warehouse:"Ujjain Murti Hub",status:"Healthy"},
 {sku:"PG-00002",name:"Bal Ganesh Home Murti — 8 inch",category:"Home Murtis",onHand:58,reserved:6,available:52,reorderAt:18,warehouse:"Ujjain Murti Hub",status:"Healthy"},
 {sku:"PG-00003",name:"Vriksha Seed Ganesh — 10 inch",category:"Seed Ganesh",onHand:32,reserved:5,available:27,reorderAt:14,warehouse:"Ujjain Earth Studio",status:"Healthy"},
 {sku:"PG-00004",name:"Rajadhiraj Premium Ganesh — 18 inch",category:"Premium",onHand:12,reserved:5,available:7,reorderAt:10,warehouse:"Ujjain Artisan Studio",status:"Low"},
 {sku:"PG-00011",name:"Vakratunda Premium Ganesh — 21 inch",category:"Premium",onHand:7,reserved:3,available:4,reorderAt:8,warehouse:"Ujjain Artisan Studio",status:"Critical"},
 {sku:"PG-00017",name:"Mandal Eco Ganesh — 30 inch",category:"Bulk Orders",onHand:5,reserved:2,available:3,reorderAt:5,warehouse:"Ujjain Large Murti Bay",status:"Critical"},
];

export const warehouses:Warehouse[]=[
 {id:"WH-UJN-01",name:"Ujjain Murti Hub",city:"Ujjain",capacity:900,used:612,ordersToday:96,sla:"2–4 days",manager:"Prakriti Operations"},
 {id:"WH-UJN-02",name:"Ujjain Earth Studio",city:"Ujjain",capacity:520,used:348,ordersToday:41,sla:"3–5 days",manager:"Earth Collection Team"},
 {id:"WH-UJN-03",name:"Ujjain Artisan Studio",city:"Ujjain",capacity:260,used:188,ordersToday:22,sla:"3–7 days",manager:"Artisan Collection Team"},
 {id:"WH-UJN-04",name:"Ujjain Large Murti Bay",city:"Ujjain",capacity:90,used:61,ordersToday:7,sla:"5–10 days",manager:"Bulk Order Team"},
];

export const stockAlerts:StockAlert[]=[
 {sku:"PG-00017",product:"Mandal Eco Ganesh — 30 inch",warehouse:"Ujjain Large Murti Bay",available:3,reorderAt:5,severity:"Critical",suggested:8},
 {sku:"PG-00011",product:"Vakratunda Premium Ganesh — 21 inch",warehouse:"Ujjain Artisan Studio",available:4,reorderAt:8,severity:"Critical",suggested:16},
 {sku:"PG-00004",product:"Rajadhiraj Premium Ganesh — 18 inch",warehouse:"Ujjain Artisan Studio",available:7,reorderAt:10,severity:"Low",suggested:20},
];

export const stockMovements:StockMovement[]=[
 {id:"PG-MV-9218",label:"Fresh Shadu batch received",sku:"PG-00001",quantity:24,kind:"Inbound",time:"18 min ago"},
 {id:"PG-MV-9217",label:"Festival customer orders",sku:"PG-00002",quantity:-6,kind:"Outbound",time:"31 min ago"},
 {id:"PG-MV-9216",label:"Earth Studio → Murti Hub",sku:"PG-00003",quantity:12,kind:"Transfer",time:"1 hr ago"},
 {id:"PG-MV-9215",label:"Artisan quality adjustment",sku:"PG-00011",quantity:-1,kind:"Adjustment",time:"2 hrs ago"},
];

export const sellers:Seller[]=[
 {id:"AR-1028",name:"Prakriti Studio",category:"Shadu & Home",rating:4.9,orders:318,revenue:462000,commission:0,status:"Active"},
 {id:"AR-1027",name:"Prakriti Earth",category:"Seed & Natural",rating:4.8,orders:204,revenue:286000,commission:0,status:"Active"},
 {id:"AR-1026",name:"Prakriti Artisan",category:"Premium & Large",rating:4.9,orders:118,revenue:418000,commission:0,status:"Active"},
];

export const sellerApplications:SellerApplication[]=[
 {id:"ART-404",business:"Mitti Kala Studio",owner:"Kunal Sharma",category:"Shadu Mati",city:"Ujjain",submitted:"Today · 5:18 PM",documents:4},
 {id:"ART-403",business:"Dharti Hastkala",owner:"Divya Patil",category:"Natural Clay",city:"Indore",submitted:"Today · 3:46 PM",documents:5},
 {id:"ART-402",business:"Morya Eco Works",owner:"Aman Joshi",category:"Seed Ganesh",city:"Dewas",submitted:"Yesterday",documents:4},
];

export const payouts:Payout[]=[
 {id:"PO-8841",seller:"Prakriti Artisan",period:"24–31 Aug",gross:148000,fees:0,net:148000,method:"Bank •• 2184",status:"Scheduled"},
 {id:"PO-8840",seller:"Prakriti Studio",period:"24–31 Aug",gross:126800,fees:0,net:126800,method:"Bank •• 9302",status:"Processing"},
 {id:"PO-8839",seller:"Prakriti Earth",period:"17–23 Aug",gross:98600,fees:0,net:98600,method:"Bank •• 4107",status:"Paid"},
];

export const campaigns:Campaign[]=[
 {id:"PG-CP-221",name:"Eco Ganesh Festival Launch",channel:"Instagram + WhatsApp",audience:"Festival shoppers",spend:18000,revenue:186000,orders:112,status:"Live"},
 {id:"PG-CP-220",name:"Shadu Mati Education",channel:"Reels + Search",audience:"Eco-conscious homes",spend:12000,revenue:128000,orders:84,status:"Live"},
 {id:"PG-CP-219",name:"Society Bulk Outreach",channel:"WhatsApp + Calls",audience:"Societies & mandals",spend:8000,revenue:218000,orders:18,status:"Scheduled"},
 {id:"PG-CP-218",name:"Seed Ganesh Gifting",channel:"Email + Homepage",audience:"Office gifting",spend:6000,revenue:74000,orders:36,status:"Paused"},
];
