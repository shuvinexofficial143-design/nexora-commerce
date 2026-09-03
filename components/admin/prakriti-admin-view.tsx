import {AdminShell} from "@/components/admin/admin-shell";
import {AdminSectionHeader} from "@/components/admin/admin-section-header";
import {AdminKpiGrid} from "@/components/admin/admin-kpi-grid";
import {RevenueChart} from "@/components/admin/revenue-chart";
import {OrderStatusCard} from "@/components/admin/order-status-card";
import {RecentOrdersTable} from "@/components/admin/recent-orders-table";
import {ProductsTable} from "@/components/admin/products-table";
import {InventoryTable} from "@/components/admin/inventory-table";
import {CustomersTable} from "@/components/admin/customers-table";
import {BulkEnquiriesTable} from "@/components/admin/bulk-enquiries-table";
import {createGaneshProductAction} from "@/app/admin/actions";
import {getPrisma} from "@/lib/db/prisma";
import {adminCoupons,adminCustomers,adminKpis,adminProducts,adminReturns,adminReviews,analyticsFunnel,bulkEnquiries,orderStatusSummary,recentOrders,revenueSeries,trafficSources} from "@/lib/admin-data";
import {inventoryItems} from "@/lib/operations-data";
import type {AdminOrder,AdminProduct} from "@/types/admin";
import type {InventoryItem,InventoryStatus} from "@/types/operations";

function mapOrderStatus(value:string):AdminOrder["status"]{
  if(value==="PACKED")return "Packed";
  if(value==="SHIPPED"||value==="OUT_FOR_DELIVERY")return "Shipped";
  if(value==="DELIVERED")return "Delivered";
  if(["RETURN_REQUESTED","RETURNED","REFUNDED","CANCELLED"].includes(value))return "Returned";
  return "Processing";
}

async function dbProducts():Promise<AdminProduct[]>{
  try{
    const rows=await getPrisma().product.findMany({orderBy:{createdAt:"desc"},take:50,include:{category:true,inventory:true}});
    if(!rows.length)return adminProducts;
    return rows.map(p=>({sku:p.sku,name:p.name,image:"🪔",category:p.category?.name??"Ganesh Murti",price:Math.round(p.priceMinor/100),stock:p.inventory.reduce((s,i)=>s+Math.max(0,i.onHand-i.reserved),0),sales:p.reviewCount,active:p.status==="ACTIVE"}));
  }catch{return adminProducts}
}

async function dbInventory():Promise<InventoryItem[]>{
  try{
    const rows=await getPrisma().inventoryItem.findMany({orderBy:{updatedAt:"desc"},take:80,include:{product:{include:{category:true}},warehouse:true}});
    if(!rows.length)return inventoryItems;
    return rows.map(i=>{
      const available=Math.max(0,i.onHand-i.reserved);
      const status:InventoryStatus=available===0?"Out":available<=Math.max(1,Math.floor(i.reorderLevel/2))?"Critical":available<=i.reorderLevel?"Low":"Healthy";
      return {sku:i.product.sku,name:i.product.name,category:i.product.category?.name??"Ganesh Murti",onHand:i.onHand,reserved:i.reserved,available,reorderAt:i.reorderLevel,warehouse:i.warehouse.name,status};
    });
  }catch{return inventoryItems}
}

async function dbOrders():Promise<AdminOrder[]>{
  try{
    const rows=await getPrisma().order.findMany({orderBy:{createdAt:"desc"},take:30,include:{user:true,items:true}});
    if(!rows.length)return recentOrders;
    return rows.map(o=>({id:o.orderNumber,customer:o.user.name,date:new Intl.DateTimeFormat("en-IN",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"}).format(o.createdAt),items:o.items.reduce((s,i)=>s+i.quantity,0),payment:o.paymentMethod??"Pending",total:Math.round(o.totalMinor/100),status:mapOrderStatus(o.status)}));
  }catch{return recentOrders}
}

function ProductCreateForm(){
  return <details className="rounded-[2rem] border border-black/10 bg-[#f5efe4] p-5 sm:p-6">
    <summary className="cursor-pointer list-none text-lg font-black text-[#17372c]">＋ Add a new Ganesh murti to database</summary>
    <p className="mt-2 text-sm font-semibold text-black/50">Creates an ACTIVE product plus its Ujjain fulfilment inventory row. Use a separate Prakriti database before production.</p>
    <form action={createGaneshProductAction} className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <input required name="name" placeholder="Murti name" className="h-12 rounded-2xl border border-black/10 bg-white px-4"/>
      <input required name="sku" placeholder="SKU e.g. PG-00019" className="h-12 rounded-2xl border border-black/10 bg-white px-4"/>
      <select name="category" className="h-12 rounded-2xl border border-black/10 bg-white px-4"><option>Shadu Mati</option><option>Home Murtis</option><option>Seed Ganesh</option><option>Natural Finish</option><option>Premium</option><option>Bulk Orders</option></select>
      <select name="brand" className="h-12 rounded-2xl border border-black/10 bg-white px-4"><option>Prakriti Studio</option><option>Prakriti Earth</option><option>Prakriti Artisan</option></select>
      <input required name="price" type="number" min="1" placeholder="Price ₹" className="h-12 rounded-2xl border border-black/10 bg-white px-4"/>
      <input name="compareAt" type="number" min="0" placeholder="MRP / compare price ₹" className="h-12 rounded-2xl border border-black/10 bg-white px-4"/>
      <input name="stock" type="number" min="0" placeholder="Initial stock" className="h-12 rounded-2xl border border-black/10 bg-white px-4"/>
      <input name="image" type="url" placeholder="Product image URL (optional)" className="h-12 rounded-2xl border border-black/10 bg-white px-4"/>
      <textarea name="description" rows={3} placeholder="Material, size, finish, eco details…" className="rounded-2xl border border-black/10 bg-white p-4 md:col-span-2 xl:col-span-3"/>
      <button className="min-h-12 rounded-2xl bg-[#17372c] px-5 font-black text-white">Create murti</button>
    </form>
  </details>
}

function Cards({items}:{items:Array<{title:string;body:string;meta?:string}>}){return <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{items.map(x=><article key={x.title} className="rounded-[2rem] border border-black/10 bg-white p-6"><p className="text-xs font-black uppercase tracking-[.16em] text-[#a54f2a]">{x.meta??"Prakriti Ganesh"}</p><h2 className="mt-2 text-xl font-black">{x.title}</h2><p className="mt-3 text-sm font-semibold leading-6 text-black/50">{x.body}</p></article>)}</div>}

export async function PrakritiAdminView({section}:{section:string}){
  const orders=await dbOrders();
  const products=await dbProducts();
  const inventory=await dbInventory();

  let content:React.ReactNode;
  if(section==="products")content=<div className="space-y-6"><AdminSectionHeader eyebrow="Catalog operations" title="Ganesh products" description="Manage eco-friendly murti listings, prices, categories and initial stock."/><ProductCreateForm/><ProductsTable products={products}/></div>;
  else if(section==="inventory")content=<div className="space-y-6"><AdminSectionHeader eyebrow="Festival stock" title="Murti inventory" description="Track available, reserved and reorder quantities across Ujjain fulfilment locations."/><InventoryTable items={inventory}/></div>;
  else if(section==="orders")content=<div className="space-y-6"><AdminSectionHeader eyebrow="Fulfilment" title="Ganesh orders" description="Recent customer orders and current dispatch status."/><RecentOrdersTable orders={orders}/></div>;
  else if(section==="bulk-enquiries")content=<div className="space-y-6"><AdminSectionHeader eyebrow="Society · Mandal · Gifting" title="Bulk enquiries" description="Prioritise large-murti and gifting enquiries by required date, quantity and quote stage."/><BulkEnquiriesTable items={bulkEnquiries}/></div>;
  else if(section==="customers")content=<div className="space-y-6"><AdminSectionHeader eyebrow="Devotee relationships" title="Customers" description="Festival shoppers, gifting customers and repeat eco buyers."/><CustomersTable customers={adminCustomers}/></div>;
  else if(section==="coupons")content=<div className="space-y-6"><AdminSectionHeader eyebrow="Offers" title="Festival coupons" description="Current Prakriti Ganesh offer set."/><Cards items={adminCoupons.map(x=>({title:x.code,body:`${x.offer} · ${x.uses} uses · attributed revenue ₹${x.revenue.toLocaleString("en-IN")}`,meta:x.active?`Active · ends ${x.ends}`:"Inactive"}))}/></div>;
  else if(section==="reviews")content=<div className="space-y-6"><AdminSectionHeader eyebrow="Quality & trust" title="Murti reviews" description="Review customer feedback, finish quality and packing experience."/><Cards items={adminReviews.map(x=>({title:`${"★".repeat(x.rating)} ${x.product}`,body:`${x.customer}: ${x.text}`,meta:x.status}))}/></div>;
  else if(section==="returns")content=<div className="space-y-6"><AdminSectionHeader eyebrow="Care resolution" title="Returns & damage cases" description="Transit damage, finish variation and delivery-resolution queue."/><Cards items={adminReturns.map(x=>({title:`${x.id} · ${x.orderId}`,body:`${x.customer} · ${x.reason} · ₹${x.amount.toLocaleString("en-IN")}`,meta:x.status}))}/></div>;
  else if(section==="analytics")content=<div className="space-y-6"><AdminSectionHeader eyebrow="Store intelligence" title="Festival analytics" description="Conversion funnel and traffic mix for the eco Ganesh storefront."/><div className="grid gap-6 lg:grid-cols-2"><section className="rounded-[2rem] border border-black/10 bg-white p-6"><h2 className="text-xl font-black">Shopping funnel</h2><div className="mt-5 space-y-4">{analyticsFunnel.map(x=><div key={x.label}><div className="mb-1 flex justify-between text-sm font-bold"><span>{x.label}</span><span>{x.value.toLocaleString("en-IN")}</span></div><div className="h-2 rounded-full bg-black/5"><div className="h-2 rounded-full bg-[#17372c]" style={{width:`${x.percent}%`}}/></div></div>)}</div></section><section className="rounded-[2rem] border border-black/10 bg-white p-6"><h2 className="text-xl font-black">Traffic sources</h2><div className="mt-5 space-y-4">{trafficSources.map(x=><div key={x.name} className="flex items-center justify-between rounded-2xl bg-black/[.03] p-4"><div><b>{x.name}</b><p className="text-xs text-black/40">{x.sessions.toLocaleString("en-IN")} sessions</p></div><span className="font-black">{x.share}%</span></div>)}</div></section></div></div>;
  else if(section==="ai-insights")content=<div className="space-y-6"><AdminSectionHeader eyebrow="AI operations" title="Ganesh selling insights" description="Actionable festival decisions derived from the current catalog and operational priorities."/><Cards items={[{title:"Protect premium stock",body:"21-inch and 30-inch artisan murtis are below reorder thresholds. Keep buffer stock for society demand.",meta:"Inventory insight"},{title:"Push Shadu education",body:"Shadu Mati is the strongest home-puja entry point. Use eco-visarjan education in search and social campaigns.",meta:"Demand insight"},{title:"Follow bulk leads first",body:"Bulk enquiries are growing faster than direct orders. Prioritise enquiries with festival dates inside the next 10 days.",meta:"Revenue insight"}]}/></div>;
  else if(section==="cms")content=<div className="space-y-6"><AdminSectionHeader eyebrow="Storefront content" title="Homepage CMS plan" description="Key Prakriti Ganesh merchandising surfaces prepared for production content controls."/><Cards items={[{title:"Hero campaign",body:"Eco-friendly Ganesh Chaturthi hero with Shop Murtis and Bulk Orders CTAs."},{title:"Collections",body:"Shadu Mati, Seed Ganesh, Home Murtis, Premium, Natural Finish and Bulk Orders."},{title:"Trust story",body:"Natural materials, artisan process, protective delivery and visarjan-conscious guidance."}]}/></div>;
  else content=<div className="space-y-7"><AdminSectionHeader eyebrow="Prakriti Ganesh Admin" title="Festival operations overview" description="One place for murti orders, stock, bulk enquiries, eco collections and launch readiness."/><AdminKpiGrid items={adminKpis}/><div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,.55fr)]"><RevenueChart data={revenueSeries}/><OrderStatusCard items={orderStatusSummary}/></div><RecentOrdersTable orders={orders}/><div className="grid gap-4 md:grid-cols-3"><a href="/admin/products" className="rounded-[2rem] bg-[#17372c] p-6 text-white"><p className="text-xs font-black uppercase tracking-[.16em] text-[#f4d7a1]">Catalog</p><p className="mt-2 text-2xl font-black">{products.length} database murtis</p><p className="mt-2 text-sm text-white/60">Open product management →</p></a><a href="/admin/inventory" className="rounded-[2rem] bg-[#f5efe4] p-6"><p className="text-xs font-black uppercase tracking-[.16em] text-[#a54f2a]">Stock</p><p className="mt-2 text-2xl font-black">{inventory.filter(x=>x.status!=="Healthy").length} need attention</p><p className="mt-2 text-sm text-black/50">Review festival inventory →</p></a><a href="/admin/bulk-enquiries" className="rounded-[2rem] border border-black/10 bg-white p-6"><p className="text-xs font-black uppercase tracking-[.16em] text-[#a54f2a]">Bulk demand</p><p className="mt-2 text-2xl font-black">{bulkEnquiries.length} active leads</p><p className="mt-2 text-sm text-black/50">Open enquiry queue →</p></a></div></div>;

  return <AdminShell>{content}</AdminShell>;
}
