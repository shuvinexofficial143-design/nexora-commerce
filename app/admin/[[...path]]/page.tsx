import type {Metadata} from "next";
import Link from "next/link";
import {redirect} from "next/navigation";
import {getCurrentSession} from "@/lib/auth/session";
import {PrakritiAdminView} from "@/components/admin/prakriti-admin-view";

export const metadata:Metadata={
  title:"Prakriti Ganesh Admin",
  description:"Secure festival operations dashboard for products, orders, inventory and bulk enquiries.",
};

type Props={params:Promise<{path?:string[]}>};

export default async function PrakritiAdminPage({params}:Props){
  let session;
  try{session=await getCurrentSession()}catch{
    return <main className="mx-auto max-w-2xl px-4 py-24 text-center"><h1 className="text-4xl font-black">Admin database is not connected</h1><p className="mt-4 text-sm font-semibold leading-6 text-black/50">Connect the separate Prakriti Ganesh PostgreSQL/Supabase database, run migrations and seed it before opening the web admin.</p><Link href="/" className="mt-6 inline-flex rounded-full bg-[#17372c] px-5 py-3 text-sm font-black text-white">Return to store</Link></main>;
  }
  if(!session)redirect("/login?next=/admin");
  if(session.user.role!=="ADMIN"){
    return <main className="mx-auto max-w-2xl px-4 py-24 text-center"><p className="text-xs font-black uppercase tracking-[.2em] text-[#a54f2a]">Protected area</p><h1 className="mt-3 text-4xl font-black">Admin access required</h1><p className="mt-4 text-sm font-semibold leading-6 text-black/50">This dashboard is restricted to Prakriti Ganesh administrators. Customer and staff accounts cannot open it.</p><Link href="/account" className="mt-6 inline-flex rounded-full bg-[#17372c] px-5 py-3 text-sm font-black text-white">Go to my account</Link></main>;
  }
  const {path=[]}=await params;
  return <PrakritiAdminView section={path[0]??"overview"}/>;
}
