import type {Campaign,InventoryItem,Payout,Seller,SellerApplication,StockAlert,StockMovement,Warehouse} from "@/types/operations";

export const inventoryItems:InventoryItem[]=[
 {sku:"NX-SHO-101",name:"Aero Run Pro Sneakers",category:"Footwear",onHand:58,reserved:16,available:42,reorderAt:20,warehouse:"Indore Central",status:"Healthy"},
 {sku:"NX-AUD-204",name:"Orbit ANC Headphones",category:"Audio",onHand:29,reserved:11,available:18,reorderAt:24,warehouse:"Delhi North",status:"Low"},
 {sku:"NX-WAT-318",name:"Pulse Fit Smartwatch",category:"Wearables",onHand:17,reserved:8,available:9,reorderAt:18,warehouse:"Mumbai West",status:"Critical"},
 {sku:"NX-BAG-421",name:"Metro Carry Backpack",category:"Bags",onHand:92,reserved:18,available:74,reorderAt:25,warehouse:"Indore Central",status:"Healthy"},
 {sku:"NX-HOM-522",name:"Halo Desk Lamp",category:"Home",onHand:18,reserved:6,available:12,reorderAt:20,warehouse:"Bengaluru South",status:"Critical"},
 {sku:"NX-BEA-602",name:"Glow Daily Care Kit",category:"Beauty",onHand:0,reserved:0,available:0,reorderAt:30,warehouse:"Delhi North",status:"Out"},
];
export const warehouses:Warehouse[]=[
 {id:"WH-IND-01",name:"Indore Central",city:"Indore",capacity:12000,used:8240,ordersToday:418,sla:"1–2 days",manager:"Naman Joshi"},
 {id:"WH-DEL-02",name:"Delhi North",city:"Delhi",capacity:18000,used:13140,ordersToday:612,sla:"Same / next day",manager:"Ira Mehta"},
 {id:"WH-MUM-03",name:"Mumbai West",city:"Mumbai",capacity:15000,used:10980,ordersToday:534,sla:"Same / next day",manager:"Raghav Rao"},
 {id:"WH-BLR-04",name:"Bengaluru South",city:"Bengaluru",capacity:14000,used:7820,ordersToday:386,sla:"1 day",manager:"Sana Kapoor"},
];
export const stockAlerts:StockAlert[]=[
 {sku:"NX-BEA-602",product:"Glow Daily Care Kit",warehouse:"Delhi North",available:0,reorderAt:30,severity:"Out",suggested:120},
 {sku:"NX-WAT-318",product:"Pulse Fit Smartwatch",warehouse:"Mumbai West",available:9,reorderAt:18,severity:"Critical",suggested:72},
 {sku:"NX-HOM-522",product:"Halo Desk Lamp",warehouse:"Bengaluru South",available:12,reorderAt:20,severity:"Critical",suggested:80},
 {sku:"NX-AUD-204",product:"Orbit ANC Headphones",warehouse:"Delhi North",available:18,reorderAt:24,severity:"Low",suggested:96},
];
export const stockMovements:StockMovement[]=[
 {id:"MV-9218",label:"Supplier receipt",sku:"NX-SHO-101",quantity:120,kind:"Inbound",time:"18 min ago"},
 {id:"MV-9217",label:"Customer orders",sku:"NX-AUD-204",quantity:-11,kind:"Outbound",time:"31 min ago"},
 {id:"MV-9216",label:"IND → MUM transfer",sku:"NX-WAT-318",quantity:36,kind:"Transfer",time:"1 hr ago"},
 {id:"MV-9215",label:"Cycle count correction",sku:"NX-HOM-522",quantity:-2,kind:"Adjustment",time:"2 hrs ago"},
];
export const sellers:Seller[]=[
 {id:"SL-1028",name:"Aero India",category:"Fashion",rating:4.8,orders:1248,revenue:1842000,commission:12,status:"Active"},
 {id:"SL-1027",name:"Orbit Labs",category:"Electronics",rating:4.7,orders:916,revenue:2418000,commission:10,status:"Active"},
 {id:"SL-1026",name:"Halo Living",category:"Home",rating:4.5,orders:642,revenue:894000,commission:14,status:"Active"},
 {id:"SL-1025",name:"Urban Loom",category:"Fashion",rating:0,orders:0,revenue:0,commission:15,status:"Pending"},
 {id:"SL-1024",name:"QuickKart Deals",category:"Multi-category",rating:3.2,orders:188,revenue:218400,commission:18,status:"Suspended"},
];
export const sellerApplications:SellerApplication[]=[
 {id:"APP-404",business:"Urban Loom",owner:"Kunal Shah",category:"Fashion",city:"Surat",submitted:"Today · 5:18 PM",documents:4},
 {id:"APP-403",business:"PureRoot Foods",owner:"Divya Nair",category:"Grocery",city:"Kochi",submitted:"Today · 3:46 PM",documents:5},
 {id:"APP-402",business:"DeskCraft Studio",owner:"Aman Arora",category:"Home",city:"Jaipur",submitted:"Yesterday",documents:4},
];
export const payouts:Payout[]=[
 {id:"PO-8841",seller:"Orbit Labs",period:"10–16 Aug",gross:482000,fees:48200,net:433800,method:"Bank •• 2184",status:"Scheduled"},
 {id:"PO-8840",seller:"Aero India",period:"10–16 Aug",gross:364800,fees:43776,net:321024,method:"Bank •• 9302",status:"Processing"},
 {id:"PO-8839",seller:"Halo Living",period:"3–9 Aug",gross:218600,fees:30604,net:187996,method:"Bank •• 4107",status:"Paid"},
 {id:"PO-8838",seller:"Glow House",period:"3–9 Aug",gross:176400,fees:26460,net:149940,method:"UPI • glow@upi",status:"Paid"},
];
export const campaigns:Campaign[]=[
 {id:"CP-221",name:"Independence Week Flash",channel:"Push + Email",audience:"High intent",spend:48000,revenue:426000,orders:312,status:"Live"},
 {id:"CP-220",name:"Sneaker Drop Retargeting",channel:"Paid social",audience:"Viewed footwear",spend:82000,revenue:618000,orders:184,status:"Live"},
 {id:"CP-219",name:"Dormant Customer Winback",channel:"Email + WhatsApp",audience:"60-day inactive",spend:14000,revenue:168000,orders:128,status:"Scheduled"},
 {id:"CP-218",name:"Beauty Bundle Test",channel:"Homepage",audience:"Beauty shoppers",spend:12000,revenue:74000,orders:66,status:"Paused"},
];
