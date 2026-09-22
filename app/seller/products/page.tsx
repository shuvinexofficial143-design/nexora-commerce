import { redirect } from "next/navigation";
import { SellerNewProductForm } from "@/components/seller/seller-new-product-form";
import { SellerProductTable } from "@/components/seller/seller-product-table";
import { getCurrentSession } from "@/lib/auth/session";
import { listSellerProducts } from "@/lib/db/seller-products";

export default async function Page() {
  const session = await getCurrentSession();
  if (!session) redirect("/login?next=/seller/products");

  const products = await listSellerProducts(session.user.id);
  const live = products.filter((product) => product.status === "Live").length;
  const drafts = products.filter((product) => product.status === "Draft").length;
  const attention = products.filter(
    (product) => product.status === "Paused" || (product.status === "Live" && product.stock < 10),
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[.18em] text-black/40">
            Catalogue
          </p>
          <h2 className="mt-2 text-3xl font-black">Products</h2>
          <p className="mt-2 max-w-2xl text-sm text-black/55">
            Only products owned by this seller account appear here.
          </p>
        </div>

        <SellerNewProductForm />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Live listings" value={String(live)} />
        <Stat label="Drafts" value={String(drafts)} />
        <Stat label="Needs attention" value={String(attention)} />
      </div>

      <SellerProductTable products={products} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-black/10 bg-white p-5">
      <p className="text-sm font-bold text-black/45">{label}</p>
      <p className="mt-2 text-3xl font-black">{value}</p>
    </div>
  );
}
