import { getPrisma } from "@/lib/db/prisma";
import { logAdmin } from "@/lib/admin/audit";

export class SellerReviewError extends Error {
  constructor(message: string, readonly status: 400 | 404 | 409) { super(message); }
}
type Seller = { id: string; userId: string; verificationStatus: string; payoutStatus: string; commissionBps: number; userStatus: string; role: string };

export async function listSellers() {
  return getPrisma().$queryRaw<Record<string, unknown>[]>`
    SELECT s.*,u."name",u."email",u."phone",u."status"::text AS "userStatus"
    FROM "SellerProfile" s JOIN "User" u ON u."id"=s."userId"
    ORDER BY s."createdAt" DESC
  `;
}
export async function updateSeller(id: string, input: Record<string, unknown>, ownerId: string) {
  if (!id || id.length > 128) throw new SellerReviewError("Invalid seller ID.", 400);
  if (!ownerId || ownerId.length > 128) throw new Error("Invalid Owner identity.");
  if (Object.keys(input).some(k => !["id","verificationStatus","commissionBps"].includes(k))) {
    throw new SellerReviewError("Only verificationStatus and commissionBps can be changed here.", 400);
  }
  const checkStatus = Object.prototype.hasOwnProperty.call(input,"verificationStatus");
  const checkCommission = Object.prototype.hasOwnProperty.call(input,"commissionBps");
  if (!checkStatus && !checkCommission) throw new SellerReviewError("No Seller changes provided.", 400);
  if (checkStatus && !["PENDING","APPROVED","REJECTED"].includes(input.verificationStatus as string))
    throw new SellerReviewError("Invalid verification status.", 400);
  const rate = input.commissionBps;
  if (checkCommission && (typeof rate !== "number" || !Number.isSafeInteger(rate) || rate < 0 || rate > 10000))
    throw new SellerReviewError("Commission must be an integer between 0 and 10000 bps.", 400);

  return getPrisma().$transaction(async tx => {
    const rows = await tx.$queryRaw<Seller[]>`
      SELECT s."id",s."userId",s."verificationStatus",s."payoutStatus",
        s."commissionBps",u."status"::text AS "userStatus",u."role"::text AS "role"
      FROM "SellerProfile" s JOIN "User" u ON u."id"=s."userId"
      WHERE s."id"=${id} FOR UPDATE OF s,u
    `;
    const previous = rows[0];
    if (!previous || previous.role !== "SELLER") throw new SellerReviewError("Seller not found.", 404);
    if (!["PENDING","APPROVED","REJECTED"].includes(previous.verificationStatus))
      throw new SellerReviewError("Seller status requires review.", 409);
    const verificationStatus = checkStatus ? input.verificationStatus as string : previous.verificationStatus;
    const commissionBps = checkCommission ? rate as number : previous.commissionBps;
    const userStatus = verificationStatus === "APPROVED" ? "ACTIVE" :
      verificationStatus === "REJECTED" ? "SUSPENDED" : "PENDING_VERIFICATION";
    const unchanged = verificationStatus === previous.verificationStatus &&
      commissionBps === previous.commissionBps && userStatus === previous.userStatus;
    if (!unchanged) {
      await tx.$executeRaw`
        UPDATE "SellerProfile"
        SET "verificationStatus"=${verificationStatus}, "commissionBps"=${commissionBps},
            "updatedAt"=now()
        WHERE "id"=${id}
      `;
      await tx.user.update({where:{id:previous.userId},
        data:{status:userStatus as "ACTIVE"|"SUSPENDED"|"PENDING_VERIFICATION"}});
      await logAdmin({adminUserId:ownerId,action:"SELLER_REVIEW",entityType:"SELLER",
        entityId:id,summary:"Seller review: "+previous.verificationStatus+" to "+verificationStatus,
        metadata:{oldStatus:previous.verificationStatus,newStatus:verificationStatus,
          oldCommission:previous.commissionBps,newCommission:commissionBps}},tx);
    }
    return {id,userId:previous.userId,verificationStatus,payoutStatus:previous.payoutStatus,
      commissionBps,userStatus,unchanged};
  });
}
