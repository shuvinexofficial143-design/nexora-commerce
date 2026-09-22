import { redirect } from "next/navigation";
import { SellerSidebar } from "@/components/seller/seller-sidebar";
import { SellerTopbar } from "@/components/seller/seller-topbar";
import { getCurrentSession } from "@/lib/auth/session";
import { getSellerAccountProfile } from "@/lib/db/seller-profile";

export default async function SellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login?next=/seller");
  }

  if (session.user.role !== "SELLER" && session.user.role !== "ADMIN") {
    redirect("/account");
  }

  const profile = await getSellerAccountProfile(session.user.id);
  const storeName = profile?.storeName || session.user.name;

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[270px_minmax(0,1fr)]">
      <SellerSidebar />
      <div className="min-w-0">
        <SellerTopbar storeName={storeName} />
        <div className="mx-auto max-w-[1600px] p-4 sm:p-6 lg:p-8">{children}</div>
      </div>
    </div>
  );
}
