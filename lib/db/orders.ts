import { createHash, randomUUID } from "node:crypto";
import { ConflictError, ValidationError } from "@/lib/db/errors";
import { getPrisma } from "@/lib/db/prisma";
import { publicProductWhere } from "@/lib/commerce/catalog-visibility";
import { deserializeProductChoiceGroups, validateChosenOptions } from "@/lib/commerce/product-choices";
import { variantSignature } from "@/lib/commerce/product-variants";
import { resolveCoupon, recordCouponRedemption } from "@/lib/commerce/coupon-engine";
import { calculateAuthoritativeTotals } from "@/lib/commerce/order-pricing";
import type { CreateOrderPayload } from "@/types/backend";

const include = {
  items: {
    include: {
      product: {
        select: {
          id: true, slug: true, name: true,
          brand: { select: { name: true } },
          images: { orderBy: { sortOrder: "asc" as const }, take: 1, select: { url: true, alt: true } },
        },
      },
    },
  },
};
const orderNumber = () =>
  `NX-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${randomUUID().slice(0, 8).toUpperCase()}`;

const keyPattern = /^[A-Za-z0-9_-]{16,128}$/;

export function validateIdempotencyKey(key: string) {
  if (!keyPattern.test(key)) {
    throw new ValidationError("A valid Idempotency-Key (16-128 letters, numbers, _ or -) is required.");
  }
  return key;
}

function orderFingerprint(input: CreateOrderPayload) {
  // Hash the canonical validated request, not user-controlled prices. Includes contact,
  // address, delivery, payment and coupon so keys cannot silently change purchase intent.
  return createHash("sha256").update(JSON.stringify({
    items: input.items,
    shippingAddress: input.shippingAddress,
    contactEmail: input.contactEmail,
    paymentMethod: input.paymentMethod,
    deliveryMethod: input.deliveryMethod,
    coupon: input.coupon ?? null,
    notes: input.notes ?? null,
  })).digest("hex");
}

function normalizeQuantities(items: CreateOrderPayload["items"]) {
  if (!Array.isArray(items) || !items.length || items.length > 100) {
    throw new ValidationError("Order must contain 1 to 100 items.");
  }
  const totals = new Map<string, number>();
  for (const item of items) {
    if (!item || typeof item.productId !== "string" || !item.productId.trim()
      || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 20) {
      throw new ValidationError("Each order item needs a valid product and quantity between 1 and 20.");
    }
    const sum = (totals.get(item.productId) ?? 0) + item.quantity;
    if (sum > 20) {
      throw new ValidationError("A product cannot exceed 20 units in one checkout.");
    }
    totals.set(item.productId, sum);
  }
  return totals;
}

export async function createOrderWithOutcome(
  userId: string,
  input: CreateOrderPayload,
  idempotencyKey?: string,
) {
  const prisma = getPrisma();
  const quantities = normalizeQuantities(input.items);
  const key = idempotencyKey ? validateIdempotencyKey(idempotencyKey) : undefined;
  const fingerprint = orderFingerprint(input);

  // The attempt row is acquired first, inside the SAME database transaction
  // as stock movement + order creation. A simultaneous INSERT on the unique
  // (userId,key) index waits for the winner to commit/rollback.
  return prisma.$transaction(async (tx) => {
    if (key) {
      const inserted = await tx.$executeRaw`
        INSERT INTO "CheckoutAttempt" ("id", "userId", "key", "requestHash", "createdAt")
        VALUES (${randomUUID()}, ${userId}, ${key}, ${fingerprint}, NOW())
        ON CONFLICT ("userId", "key") DO NOTHING
      `;
      if (inserted === 0) {
        const attempt = await tx.checkoutAttempt.findUniqueOrThrow({
          where: { userId_key: { userId, key } },
        });
        if (attempt.requestHash !== fingerprint) {
          throw new ConflictError("This checkout key belongs to a different order request.");
        }
        if (!attempt.orderId) {
          throw new ConflictError("This checkout attempt is still processing. Retry shortly.");
        }
        const original = await tx.order.findUnique({ where: { id: attempt.orderId }, include });
        if (!original) throw new ConflictError("Checkout reference could not be resolved.");
        return { order: original, created: false };
      }
    }

    // Fresh catalog read is inside the transaction. Never rely on client prices.
    const ids = [...quantities.keys()];
    const visibility = await publicProductWhere(tx);
    const products = await tx.product.findMany({
      where: { id: { in: ids }, status: "ACTIVE", AND: [visibility] },
      include: { inventory: true, choiceGroups: true, variants: true },
    });
    if (products.length !== ids.length) {
      throw new ValidationError("One or more products are unavailable.");
    }
    const byId = new Map(products.map((product) => [product.id, product]));
    let subtotalMinor = 0;
    const variantDemand = new Map<string, number>();
    const baseQuantities = new Map<string, number>();
    const itemData = input.items.map((item) => {
      const product = byId.get(item.productId)!;
      if (!Number.isSafeInteger(product.priceMinor) || product.priceMinor < 0) {
        throw new ValidationError("Product pricing is currently unavailable.");
      }
      const selected = validateChosenOptions(deserializeProductChoiceGroups(product.choiceGroups), item.variant);
      const priced = product.variants.length ? product.variants.find(
        variant => variant.active && variant.signature === variantSignature(selected),
      ) : null;
      if (product.variants.length && !priced) {
        throw new ValidationError(product.name + ": selected SKU combination is unavailable.");
      }
      if (priced) variantDemand.set(priced.id, (variantDemand.get(priced.id) ?? 0) + item.quantity);
      else baseQuantities.set(product.id, (baseQuantities.get(product.id) ?? 0) + item.quantity);
      const unitPriceMinor = priced ? priced.priceMinor : product.priceMinor;
      if (!Number.isSafeInteger(unitPriceMinor) || unitPriceMinor < 0) {
        throw new ValidationError("Product variant price is unavailable.");
      }
      // The checked-out price must match the most recent server quote.
      // Stock and price can change between preflight and this transaction.
      if (item.expectedUnitPriceMinor !== undefined && item.expectedUnitPriceMinor !== unitPriceMinor) {
        throw new ValidationError("Product price changed after verification. Review your cart.");
      }
      const totalMinor = unitPriceMinor * item.quantity;
      subtotalMinor += totalMinor;
      return {
        productId: product.id,
        productVariantId: priced?.id,
        productName: product.name,
        sku: priced?.sku ?? product.sku,
        quantity: item.quantity,
        unitPriceMinor,
        totalMinor,
        variant: selected,
      };
    });
    if (!Number.isSafeInteger(subtotalMinor) || subtotalMinor > 2_000_000_000) {
      throw new ValidationError("Cart total exceeds the permitted limit.");
    }

    // Resolve coupon in transaction; usage is claimed atomically on redemption.
    const promo = await resolveCoupon(input.coupon, subtotalMinor, tx);
    if (input.coupon && !promo.coupon) {
      throw new ValidationError("This coupon is no longer valid for your cart.");
    }
    const { discountMinor, shippingMinor, taxMinor, totalMinor } = calculateAuthoritativeTotals({
      subtotalMinor, discountMinor: promo.discountMinor,
      deliveryMethod: input.deliveryMethod ?? "standard",
    });

    const order = await tx.order.create({
      data: {
        orderNumber: orderNumber(), userId, subtotalMinor, discountMinor,
        shippingMinor, taxMinor, totalMinor,
        paymentMethod: input.paymentMethod ?? null,
        shippingAddress: input.shippingAddress,
        notes: input.notes ?? null,
        items: { create: itemData },
      },
      include,
    });

    // Variant inventory is separate from parent inventory; never reserve both.
    // Atomic WHERE test protects against concurrent buyers overselling a SKU.
    for (const [variantId, demand] of [...variantDemand].sort(([a], [b]) => a.localeCompare(b))) {
      const claimed = await tx.$executeRaw`
        UPDATE "ProductVariant"
        SET "reserved" = "reserved" + ${demand}, "updatedAt" = NOW()
        WHERE "id" = ${variantId} AND "active" = true
          AND "onHand" >= 0 AND "reserved" >= 0
          AND "onHand" - "reserved" >= ${demand}
      `;
      if (claimed !== 1) throw new ValidationError("Selected variant stock changed during checkout.");
      await tx.productVariantMovement.create({
        data: { variantId, orderId: order.id, type: "RESERVE", quantity: demand,
          reference: order.orderNumber },
      });
    }

    // Aggregate demand by product across variants and repeated lines. Always lock
    // acquisition in product ID + inventory ID order to limit deadlock risk.
    for (const [productId, demand] of [...baseQuantities].sort(([a], [b]) => a.localeCompare(b))) {
      const product = byId.get(productId)!;
      let remaining = demand;
      for (const stock of [...product.inventory].sort((a, b) => a.id.localeCompare(b.id))) {
        if (remaining === 0) break;
        const available = Math.max(0, stock.onHand - stock.reserved);
        const quantity = Math.min(available, remaining);
        if (quantity <= 0) continue;

        // PostgreSQL rechecks WHERE after any competing updater commits. This
        // is the authoritative stock test, NOT the prior inventory snapshot.
        const updated = await tx.$executeRaw`
          UPDATE "InventoryItem"
          SET "reserved" = "reserved" + ${quantity}, "updatedAt" = NOW()
          WHERE "id" = ${stock.id}
            AND "onHand" >= 0 AND "reserved" >= 0
            AND "onHand" - "reserved" >= ${quantity}
        `;
        if (updated !== 1) {
          throw new ValidationError(`${product.name} stock changed during checkout. Please try again.`);
        }
        await tx.inventoryMovement.create({
          data: {
            warehouseId: stock.warehouseId, productId, type: "RESERVE",
            quantity, reference: order.orderNumber,
          },
        });
        remaining -= quantity;
      }
      if (remaining !== 0) {
        throw new ValidationError(`${product.name} does not have enough stock.`);
      }
    }

    await recordCouponRedemption(tx, {
      coupon: promo.coupon, userId, orderId: order.id, discountMinor,
    });
    if (key) {
      await tx.checkoutAttempt.update({
        where: { userId_key: { userId, key } },
        data: { orderId: order.id },
      });
    }
    return { order, created: true };
  }, { timeout: 15_000, maxWait: 10_000 });
}

// Preserve the original return type for existing internal callers; only the
// HTTP route opts into replay-aware notifications.
export async function createOrder(
  userId: string,
  input: CreateOrderPayload,
  idempotencyKey?: string,
) {
  const { order } = await createOrderWithOutcome(userId, input, idempotencyKey);
  return order;
}

export async function listOrdersForUser(userId: string) {
  return getPrisma().order.findMany({
    where: { userId }, include, orderBy: { createdAt: "desc" }, take: 50,
  });
}

export async function getOrderForUser(userId: string, orderId: string, elevated = false) {
  const order = await getPrisma().order.findFirst({
    where: elevated
      ? { OR: [{ id: orderId }, { orderNumber: orderId }] }
      : { userId, OR: [{ id: orderId }, { orderNumber: orderId }] },
    include,
  });
  if (!order) {
    const { NotFoundError } = await import("@/lib/db/errors");
    throw new NotFoundError("Order not found.");
  }
  return order;
}
