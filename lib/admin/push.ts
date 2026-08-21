import { randomUUID } from "node:crypto"; import { getPrisma } from "@/lib/db/prisma";
export async function registerPush(adminUserId:string,platform:string,token:string){
 await getPrisma().$executeRaw`
 insert into "AdminPushDevice"("id","adminUserId","platform","token","enabled","lastSeenAt","createdAt")
 values(${randomUUID()},${adminUserId},${platform},${token},true,now(),now())
 on conflict("token") do update set "adminUserId"=excluded."adminUserId","enabled"=true,"lastSeenAt"=now()`;
}
