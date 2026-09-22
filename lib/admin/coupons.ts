import { randomUUID } from "node:crypto";
import { getPrisma } from "@/lib/db/prisma";

type CouponRow = Record<string, unknown>;
type CouponInput = Record<string, unknown>;

export async function listCoupons() {
  return getPrisma().$queryRaw<CouponRow[]>`
    select * from "Coupon" order by "createdAt" desc
  `;
}

export async function createCoupon(input: CouponInput) {
  const id = randomUUID();
  const code = String(input.code ?? "").trim().toUpperCase();
  const kind = String(input.kind ?? "PERCENT");

  if (code.length < 3) throw new Error("Coupon code is required.");

  await getPrisma().$executeRaw`
    insert into "Coupon"(
      "id","code","kind","value","minSubtotalMinor","maxDiscountMinor","active","createdAt","updatedAt"
    )
    values(
      ${id},
      ${code},
      ${kind},
      ${Number(input.value ?? 0)},
      ${Math.round(Number(input.minSubtotal ?? 0) * 100)},
      ${input.maxDiscount ? Math.round(Number(input.maxDiscount) * 100) : null},
      true,
      now(),
      now()
    )`;

  return { id, code };
}

export async function toggleCoupon(id: string, active: boolean) {
  await getPrisma().$executeRaw`
    update "Coupon"
    set "active"=${active},"updatedAt"=now()
    where "id"=${id}
  `;
}
