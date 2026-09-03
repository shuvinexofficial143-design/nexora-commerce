import type {Metadata} from "next";
import {redirect} from "next/navigation";
import {AdminShell} from "@/components/admin/admin-shell";
import {AdminSectionHeader} from "@/components/admin/admin-section-header";
import {BulkEnquiriesTable} from "@/components/admin/bulk-enquiries-table";
import {getCurrentSession} from "@/lib/auth/session";
import {getPrisma} from "@/lib/db/prisma";
import {bulkEnquiries as fallback} from "@/lib/admin-data";
import type {AdminBulkEnquiry,AdminBulkEnquiryStatus} from "@/types/admin";

export const metadata:Metadata={title:"Bulk Enquiries | Prakriti Ganesh Admin"};

function statusLabel(value:string):AdminBulkEnquiryStatus{
  if(value==="CONTACTED")return "Contacted";
  if(value==="QUOTED")return "Quoted";
  if(value==="CONFIRMED")return "Confirmed";
  return "New";
}

export default async function BulkEnquiriesAdminPage(){
  const session=await getCurrentSession();
  if(!session)redirect("/login?next=/admin/bulk-enquiries");
  if(session.user.role!=="ADMIN")redirect("/account");

  let items:AdminBulkEnquiry[]=fallback;
  try{
    const rows=await getPrisma().bulkEnquiry.findMany({orderBy:{createdAt:"desc"},take:100});
    if(rows.length)items=rows.map(row=>({
      id:row.id.slice(-8).toUpperCase(),
      name:row.name,
      organization:row.organization??"Individual enquiry",
      phone:row.phone,
      city:row.city,
      size:row.size,
      quantity:row.quantity,
      budget:row.budget??"Not shared",
      neededBy:row.neededBy?new Intl.DateTimeFormat("en-IN",{day:"2-digit",month:"short"}).format(row.neededBy):"Flexible",
      status:statusLabel(row.status),
    }));
  }catch{}

  return <AdminShell><div className="space-y-6"><AdminSectionHeader eyebrow="Society · Mandal · Gifting" title="Bulk enquiries" description="Live requirements submitted from the Prakriti Ganesh bulk-order form, newest first."/><BulkEnquiriesTable items={items}/></div></AdminShell>;
}
