import { randomUUID } from "node:crypto";
import { getPrisma } from "@/lib/db/prisma";
import type { SellerAccountProfile } from "@/types/seller";

type SellerProfileRow = {
  profileId: string | null;
  userId: string;
  storeName: string | null;
  ownerName: string;
  email: string;
  phone: string | null;
  gstNumber: string | null;
  verificationStatus: string | null;
  payoutStatus: string | null;
  commissionBps: number | null;
};

function serialize(row: SellerProfileRow): SellerAccountProfile {
  return {
    profileId: row.profileId,
    userId: row.userId,
    storeName: row.storeName?.trim() || row.ownerName,
    ownerName: row.ownerName,
    email: row.email,
    phone: row.phone ?? "",
    gstNumber: row.gstNumber ?? "",
    verificationStatus: row.verificationStatus ?? "PENDING",
    payoutStatus: row.payoutStatus ?? "HOLD",
    commissionBps: row.commissionBps ?? 1000,
  };
}

export async function getSellerAccountProfile(userId: string) {
  const rows = await getPrisma().$queryRaw<SellerProfileRow[]>`
    select
      s."id" as "profileId",
      u."id" as "userId",
      s."storeName",
      u."name" as "ownerName",
      u."email",
      u."phone",
      s."gstNumber",
      s."verificationStatus",
      s."payoutStatus",
      s."commissionBps"
    from "User" u
    left join "SellerProfile" s on s."userId"=u."id"
    where u."id"=${userId}
    limit 1
  `;

  const row = rows[0];
  return row ? serialize(row) : null;
}

export async function updateSellerAccountProfile(
  userId: string,
  input: {
    storeName: string;
    ownerName: string;
    phone: string;
    gstNumber: string;
  },
) {
  const prisma = getPrisma();

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: {
        name: input.ownerName,
        phone: input.phone || null,
      },
    });

    const existing = await tx.$queryRaw<Array<{ id: string }>>`
      select "id" from "SellerProfile" where "userId"=${userId} limit 1
    `;

    if (existing[0]) {
      await tx.$executeRaw`
        update "SellerProfile"
        set "storeName"=${input.storeName},
            "gstNumber"=${input.gstNumber || null},
            "updatedAt"=now()
        where "id"=${existing[0].id}
      `;
    } else {
      await tx.$executeRaw`
        insert into "SellerProfile"(
          "id","userId","storeName","gstNumber","commissionBps",
          "verificationStatus","payoutStatus","createdAt","updatedAt"
        )
        values(
          ${randomUUID()},
          ${userId},
          ${input.storeName},
          ${input.gstNumber || null},
          1000,
          "PENDING",
          "HOLD",
          now(),
          now()
        )
      `;
    }
  });

  return getSellerAccountProfile(userId);
}
