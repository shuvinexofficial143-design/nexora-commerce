"use client";
import {usePathname} from "next/navigation";
import {SiteFooter} from "@/components/layout/site-footer";
import {SiteHeader} from "@/components/layout/site-header";
export function SiteChrome({children}:{children:React.ReactNode}){const pathname=usePathname();if(pathname.startsWith("/admin")||pathname.startsWith("/seller"))return <main className="min-h-screen bg-[#f5f5f1]">{children}</main>;return <><SiteHeader/><main>{children}</main><SiteFooter/></>}
