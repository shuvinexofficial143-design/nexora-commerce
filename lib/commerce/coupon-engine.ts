import { randomUUID } from "node:crypto";
import type { Prisma } from "@/generated/prisma/client";
import { getPrisma } from "@/lib/db/prisma";

export type CouponRecord = {
  id: string;
  code: string;
  kind: string;
  value: number;
  minSubtotalMinor: number;
  maxDiscountMinor: number | null;
  active: boolean;
  startsAt: Date | null;
  endsAt: Date | null;
  usageLimit: number | null;
  usageCount: number;
};

type CouponRedemptionInput = {
  coupon: CouponRecord | null;
  discountMinor: number;
  orderId: string;
  userId: string;
};

export async function resolveCoupon(code: string | undefined, subtotalMinor: number) {
  const normalized = code?.trim().toUpperCase();
  if (!normalized) return { coupon: null, discountMinor: 0 };

  const rows = await getPrisma().$queryRaw<CouponRecord[]>`
    select * from "Coupon" where "code"=${normalized} and "active"=true limit 1
  `;

  const coupon = rows[0];
  if (!coupon) return { coupon: null, discountMinor: 0 };

  const now = Date.now();
  if (coupon.startsAt && new Date(coupon.startsAt).getTime() > now) {
    return { coupon: null, discountMinor: 0 };
  }
  if (coupon.endsAt && new Date(coupon.endsAt).getTime() < now) {
    return { coupon: null, discountMinor: 0 };
  }
  if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
    return { coupon: null, discountMinor: 0 };
  }
  if (subtotalMinor < coupon.minSubtotalMinor) {
    return { coupon: null, discountMinor: 0 };
  }

  let discount =
    coupon.kind === "PERCENT"
      ? Math.round(subtotalMinor * (coupon.value / 100))
      : coupon.value * 100;

  if (coupon.maxDiscountMinor !== null) {
    discount = Math.min(discount, coupon.maxDiscountMinor);
  }

  return {
    coupon,
    discountMinor: Math.max(0, Math.min(subtotalMinor, discount)),
  };
}

export async function recordCouponRedemption(
  tx: Prisma.TransactionClient,
  input: CouponRedemptionInput,
) {
  if (!input.coupon || input.discountMinor <= 0) return;

  const existing = await tx.$queryRaw<Array<{ id: string }>>`
    select "id" from "CouponRedemption" where "orderId"=${input.orderId} limit 1
  `;
  if (existing.length) return;

  await tx.$executeRaw`
    insert into "CouponRedemption"(
      "id","couponId","userId","orderId","discountMinor","createdAt"
    )
    values(
      ${randomUUID()},
      ${input.coupon.id},
      ${input.userId},
      ${input.orderId},
      ${input.discountMinor},
      now()
    )
  `;

  await tx.$executeRaw`
    update "Coupon"
    set "usageCount"="usageCount"+1,"updatedAt"=now()
    where "id"=${input.coupon.id}
  `;
}
