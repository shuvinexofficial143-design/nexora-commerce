import { getPrisma } from "@/lib/db/prisma";
export async function listSellers(){return getPrisma().$queryRaw<any[]>`
 select s.*,u."name",u."email",u."phone" from "SellerProfile" s join "User" u on u."id"=s."userId" order by s."createdAt" desc`}
export async function updateSeller(id:string,b:any){await getPrisma().$executeRaw`
 update "SellerProfile" set "verificationStatus"=${String(b.verificationStatus??"PENDING")},
 "payoutStatus"=${String(b.payoutStatus??"HOLD")},"commissionBps"=${Number(b.commissionBps??1000)},"updatedAt"=now() where "id"=${id}`}
