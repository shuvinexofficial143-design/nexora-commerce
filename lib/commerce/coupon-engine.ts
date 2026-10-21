import { randomUUID } from "node:crypto";
import { ValidationError } from "@/lib/db/errors";
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

export async function resolveCoupon(
  code: string | undefined,
  subtotalMinor: number,
  tx?: Prisma.TransactionClient,
) {
  const normalized = code?.trim().toUpperCase();
  if (!normalized) return { coupon: null, discountMinor: 0 };
  const prisma = tx ?? getPrisma();
  const rows = await prisma.$queryRaw<CouponRecord[]>`
    SELECT * FROM "Coupon" WHERE "code"=${normalized} AND "active"=true LIMIT 1
  `;
  const coupon = rows[0];
  if (!coupon) return { coupon: null, discountMinor: 0 };
  const now = Date.now();
  if (coupon.startsAt && new Date(coupon.startsAt).getTime() > now) return { coupon: null, discountMinor: 0 };
  if (coupon.endsAt && new Date(coupon.endsAt).getTime() < now) return { coupon: null, discountMinor: 0 };
  if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) return { coupon: null, discountMinor: 0 };
  if (subtotalMinor < coupon.minSubtotalMinor) return { coupon: null, discountMinor: 0 };

  // Reject misconfigured coupon values rather than allowing negative prices
  // or discounts higher than the subtotal.
  if (!Number.isFinite(coupon.value) || coupon.value <= 0 ||
    (coupon.kind === "PERCENT" && coupon.value > 100) ||
    !["PERCENT", "FIXED"].includes(coupon.kind)) {
    throw new ValidationError("Coupon configuration is invalid.");
  }
  let discount = coupon.kind === "PERCENT"
    ? Math.round(subtotalMinor * coupon.value / 100)
    : Math.round(coupon.value * 100);
  if (coupon.maxDiscountMinor !== null) discount = Math.min(discount, coupon.maxDiscountMinor);
  return { coupon, discountMinor: Math.max(0, Math.min(subtotalMinor, discount)) };
}

export async function recordCouponRedemption(tx: Prisma.TransactionClient, input: CouponRedemptionInput) {
  if (!input.coupon || input.discountMinor <= 0) return;
  const existing = await tx.$queryRaw<Array<{ id: string }>>`
    SELECT "id" FROM "CouponRedemption" WHERE "orderId"=${input.orderId} LIMIT 1
  `;
  if (existing.length) return;

  // This UPDATE is an atomic claim. Concurrent buyers cannot both spend
  // the final use: PostgreSQL rechecks usageCount after row-lock wait.
  const claimed = await tx.$executeRaw`
    UPDATE "Coupon" SET "usageCount"="usageCount"+1, "updatedAt"=NOW()
    WHERE "id"=${input.coupon.id} AND "active"=true
      AND ("usageLimit" IS NULL OR "usageCount" < "usageLimit")
  `;
  if (claimed !== 1) {
    throw new ValidationError("This coupon has reached its usage limit.");
  }
  // Unique orderId enforced by the reviewed schema migration, so concurrent
  // duplicate claims for one order fail atomically and roll back the claim.
  await tx.$executeRaw`
    INSERT INTO "CouponRedemption" ("id","couponId","userId","orderId","discountMinor","createdAt")
    VALUES (${randomUUID()},${input.coupon.id},${input.userId},${input.orderId},${input.discountMinor},NOW())
  `;
}
