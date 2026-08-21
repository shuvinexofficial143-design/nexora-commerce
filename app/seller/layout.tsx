import {SellerSidebar} from "@/components/seller/seller-sidebar";
import {SellerTopbar} from "@/components/seller/seller-topbar";
export default function SellerLayout({children}:{children:React.ReactNode}){return <div className="min-h-screen lg:grid lg:grid-cols-[270px_minmax(0,1fr)]"><SellerSidebar/><div className="min-w-0"><SellerTopbar/><div className="mx-auto max-w-[1600px] p-4 sm:p-6 lg:p-8">{children}</div></div></div>}
