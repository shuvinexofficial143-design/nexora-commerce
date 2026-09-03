"use server";

import {redirect} from "next/navigation";
import {getPrisma} from "@/lib/db/prisma";

export async function submitBulkEnquiryAction(formData:FormData){
  const name=String(formData.get("name")??"").trim();
  const organization=String(formData.get("organization")??"").trim();
  const phone=String(formData.get("phone")??"").trim();
  const email=String(formData.get("email")??"").trim();
  const city=String(formData.get("city")??"").trim();
  const size=String(formData.get("size")??"").trim();
  const quantity=Math.max(1,Math.floor(Number(formData.get("quantity")||1)));
  const budget=String(formData.get("budget")??"").trim();
  const neededByRaw=String(formData.get("neededBy")??"").trim();
  const requirement=String(formData.get("requirement")??"").trim();

  if(name.length<2||phone.length<7||city.length<2||size.length<2)throw new Error("Name, phone, city and murti size are required.");

  await getPrisma().bulkEnquiry.create({
    data:{
      name,
      organization:organization||null,
      phone,
      email:email||null,
      city,
      size,
      quantity,
      budget:budget||null,
      neededBy:neededByRaw?new Date(`${neededByRaw}T00:00:00.000Z`):null,
      requirement:requirement||null,
    },
  });

  redirect(`/bulk-orders?submitted=1&name=${encodeURIComponent(name)}`);
}
