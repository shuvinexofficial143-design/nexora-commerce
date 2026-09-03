"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { getCurrentSession } from "@/lib/auth/session";
import { getPrisma } from "@/lib/db/prisma";

function slugify(value:string){
  return value.trim().toLowerCase().replace(/&/g,"and").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
}

async function requireWebAdmin(){
  const session=await getCurrentSession();
  if(!session||session.user.role!=="ADMIN") throw new Error("Admin authorization required.");
  return session;
}

export async function createGaneshProductAction(formData:FormData){
  await requireWebAdmin();
  const name=String(formData.get("name")??"").trim();
  const sku=String(formData.get("sku")??"").trim().toUpperCase();
  const categoryName=String(formData.get("category")??"Shadu Mati").trim();
  const brandName=String(formData.get("brand")??"Prakriti Studio").trim();
  const description=String(formData.get("description")??"").trim();
  const image=String(formData.get("image")??"").trim();
  const price=Number(formData.get("price"));
  const compareAt=Number(formData.get("compareAt")||0);
  const stock=Math.max(0,Math.floor(Number(formData.get("stock")||0)));

  if(name.length<2||sku.length<3||!Number.isFinite(price)||price<=0) throw new Error("Name, SKU and a valid price are required.");

  const prisma=getPrisma();
  const categorySlug=slugify(categoryName);
  const brandSlug=slugify(brandName);
  const category=await prisma.category.upsert({where:{slug:categorySlug},update:{name:categoryName},create:{name:categoryName,slug:categorySlug}});
  const brand=await prisma.brand.upsert({where:{slug:brandSlug},update:{name:brandName},create:{name:brandName,slug:brandSlug}});
  const warehouse=await prisma.warehouse.upsert({
    where:{code:"UJN-01"},
    update:{active:true},
    create:{code:"UJN-01",name:"Ujjain Murti Fulfilment Centre",city:"Ujjain",state:"Madhya Pradesh"},
  });

  const product=await prisma.product.create({
    data:{
      slug:`${slugify(name)}-${randomUUID().slice(0,6)}`,
      sku,
      name,
      shortDescription:`${categoryName} eco-friendly Ganesh murti by ${brandName}`,
      description:description||`${name} is part of the Prakriti Ganesh eco-friendly collection.`,
      priceMinor:Math.round(price*100),
      compareAtMinor:compareAt>price?Math.round(compareAt*100):null,
      status:"ACTIVE",
      categoryId:category.id,
      brandId:brand.id,
    },
  });

  if(image){
    await prisma.productImage.create({data:{productId:product.id,url:image,alt:name,sortOrder:0}});
  }
  await prisma.inventoryItem.create({data:{productId:product.id,warehouseId:warehouse.id,onHand:stock,reorderLevel:Math.max(3,Math.ceil(stock*.25))}});

  revalidatePath("/admin/products");
  revalidatePath("/shop");
}
