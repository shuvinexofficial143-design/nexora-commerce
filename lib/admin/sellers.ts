import { getPrisma } from "@/lib/db/prisma";

type SellerRow = Record<string, unknown>;

export async function listSellers() {
  return getPrisma().$queryRaw<SellerRow[]>`
    select s.*,u."name",u."email",u."phone"
    from "SellerProfile" s
    join "User" u on u."id"=s."userId"
    order by s."createdAt" desc
  `;
}

export async function updateSeller(id: string, input: Record<string, unknown>) {
  await getPrisma().$executeRaw`
    update "SellerProfile"
    set "verificationStatus"=${String(input.verificationStatus ?? "PENDING")},
        "payoutStatus"=${String(input.payoutStatus ?? "HOLD")},
        "commissionBps"=${Number(input.commissionBps ?? 1000)},
        "updatedAt"=now()
    where "id"=${id}
  `;
}
