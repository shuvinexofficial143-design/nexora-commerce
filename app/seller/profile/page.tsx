import { redirect } from "next/navigation";
import { SellerProfileForm } from "@/components/seller/seller-profile-form";
import { getCurrentSession } from "@/lib/auth/session";
import { getSellerAccountProfile } from "@/lib/db/seller-profile";
import type { SellerAccountProfile } from "@/types/seller";

export default async function Page() {
  const session = await getCurrentSession();
  if (!session) redirect("/login?next=/seller/profile");

  const loaded = await getSellerAccountProfile(session.user.id);
  const profile: SellerAccountProfile =
    loaded ?? {
      profileId: null,
      userId: session.user.id,
      storeName: session.user.name,
      ownerName: session.user.name,
      email: session.user.email,
      phone: session.user.phone ?? "",
      gstNumber: "",
      verificationStatus: "PENDING",
      payoutStatus: "HOLD",
      commissionBps: 1000,
    };

  const verified = profile.verificationStatus === "VERIFIED";

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-black uppercase tracking-[.18em] text-black/40">
          Settings
        </p>
        <h2 className="mt-2 text-3xl font-black">Seller profile</h2>
        <p className="mt-2 text-sm text-black/55">
          Manage the seller identity stored in your NEXORA account.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <SellerProfileForm profile={profile} />

        <aside className="space-y-4">
          <section className="rounded-[28px] border border-black/10 bg-white p-5">
            <p className="text-sm font-bold text-black/45">Verification</p>
            <p className="mt-2 text-2xl font-black">
              {verified ? "Verified ✓" : profile.verificationStatus}
            </p>
            <p className="mt-2 text-sm leading-6 text-black/55">
              Seller verification status comes directly from the marketplace database.
            </p>
          </section>

          <section className="rounded-[28px] bg-black p-5 text-white">
            <p className="text-sm font-bold text-white/45">Payout status</p>
            <p className="mt-2 text-2xl font-black">{profile.payoutStatus}</p>
            <p className="mt-2 text-sm leading-6 text-white/55">
              Current marketplace commission: {(profile.commissionBps / 100).toFixed(2)}%.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
