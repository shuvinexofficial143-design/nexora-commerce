import { NextResponse } from "next/server";
import { ConflictError, DatabaseNotConfiguredError, NotFoundError, ValidationError } from "@/lib/db/errors";
import type { CreateOrderPayload } from "@/types/backend";
import { cashfreeConfigured } from "@/lib/payments/cashfree";
import { normalizeChosenOptions } from "@/lib/commerce/product-choices";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data }, init);
}

export function apiError(error: unknown) {
  if (error instanceof ValidationError) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  if (error instanceof ConflictError) return NextResponse.json({ ok: false, error: error.message }, { status: 409 });
  if (error instanceof NotFoundError) return NextResponse.json({ ok: false, error: error.message }, { status: 404 });
  if (error instanceof DatabaseNotConfiguredError) return NextResponse.json({ ok: false, error: error.message }, { status: 503 });

  console.error("NEXORA backend error", error);
  return NextResponse.json({ ok: false, error: "Unexpected server error." }, { status: 500 });
}

export function validateRegistration(value: unknown) {
  const input = (value ?? {}) as Record<string, unknown>;
  const name = String(input.name ?? "").trim();
  const email = String(input.email ?? "").trim().toLowerCase();
  const phone = String(input.phone ?? "").trim();
  const password = String(input.password ?? "");
  if (name.length < 2) throw new ValidationError("Name must be at least 2 characters.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ValidationError("Enter a valid email address.");
  if (password.length < 8) throw new ValidationError("Password must be at least 8 characters.");
  return { name, email, phone: phone || undefined, password };
}

export function validateLogin(value: unknown) {
  const input = (value ?? {}) as Record<string, unknown>;
  const email = String(input.email ?? "").trim().toLowerCase();
  const password = String(input.password ?? "");
  if (!email || !password) throw new ValidationError("Email and password are required.");
  return { email, password };
}

export function validateOrder(value: unknown): CreateOrderPayload {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ValidationError("Invalid checkout request.");
  }
  const input = value as Partial<CreateOrderPayload>;
  if (!Array.isArray(input.items) || input.items.length < 1 || input.items.length > 100) {
    throw new ValidationError("Order must contain 1 to 100 items.");
  }
  const perProduct = new Map<string, number>();
  const items = input.items.map((raw) => {
    if (!raw || typeof raw !== "object") throw new ValidationError("Invalid order item.");
    const productId = String(raw.productId ?? "").trim();
    const quantity = raw.quantity;
    if (!productId || productId.length > 128 || typeof quantity !== "number" ||
      !Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
      throw new ValidationError("Each order item needs a valid product and quantity between 1 and 20.");
    }
    const total = (perProduct.get(productId) ?? 0) + quantity;
    if (total > 20) throw new ValidationError("A product cannot exceed 20 units in one checkout.");
    perProduct.set(productId, total);
    if (raw.variant !== undefined &&
      (!raw.variant || typeof raw.variant !== "object" || Array.isArray(raw.variant) ||
       JSON.stringify(raw.variant).length > 2048)) {
      throw new ValidationError("Invalid product variant.");
    }
    return { productId, quantity, variant: normalizeChosenOptions(raw.variant) };
  });
  if (!input.shippingAddress || typeof input.shippingAddress !== "object" || Array.isArray(input.shippingAddress)) {
    throw new ValidationError("Shipping address is required.");
  }
  const address = input.shippingAddress;
  const required = (field: keyof typeof address, maximum: number, minimum = 1) => {
    const raw = address[field];
    if (typeof raw !== "string") throw new ValidationError(`Shipping ${field} is invalid.`);
    const text = raw.trim();
    if (text.length < minimum || text.length > maximum) throw new ValidationError(`Shipping ${field} is invalid.`);
    return text;
  };
  const fullName = required("fullName", 100, 2);
  const line1 = required("line1", 200, 3);
  const city = required("city", 100, 2);
  const state = required("state", 100, 2);
  const rawPhone = required("phone", 20);
  const phone = rawPhone.replace(/[\s()-]/g, "").replace(/^\+91/, "");
  if (!/^[6-9]\d{9}$/.test(phone)) throw new ValidationError("Enter a valid 10-digit Indian mobile number.");
  const postalCode = required("postalCode", 6);
  if (!/^[1-9]\d{5}$/.test(postalCode)) throw new ValidationError("Enter a valid 6-digit Indian PIN code.");
  const country = address.country ? required("country", 50) : "India";
  if (country.toLowerCase() !== "india") throw new ValidationError("Delivery is currently available only in India.");
  const line2 = address.line2 ? required("line2", 200) : undefined;

  const contactEmail = String(input.contactEmail ?? "").trim().toLowerCase();
  if (contactEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
    throw new ValidationError("Enter a valid checkout email address.");
  }
  const paymentMethod = String(input.paymentMethod ?? "cod").toLowerCase();
  if (!["cod", "cashfree"].includes(paymentMethod)) {
    throw new ValidationError("Choose a valid payment method.");
  }
  if (paymentMethod === "cashfree" && !cashfreeConfigured()) {
    throw new ValidationError("Cashfree online payments are not configured yet. Choose Cash on Delivery.");
  }
  const deliveryMethod = String(input.deliveryMethod ?? "standard").toLowerCase();
  if (!["standard", "express", "priority"].includes(deliveryMethod)) {
    throw new ValidationError("Choose a valid delivery method.");
  }
  if (deliveryMethod !== "standard") {
    throw new ValidationError("Only standard delivery is currently available.");
  }
  const coupon = String(input.coupon ?? "").trim().toUpperCase();
  if (coupon.length > 40) throw new ValidationError("Coupon code is too long.");
  const notes = String(input.notes ?? "");
  if (notes.length > 500) throw new ValidationError("Checkout notes are too long.");

  return {
    items,
    shippingAddress: { fullName, phone, line1, line2, city, state, postalCode, country: "India" },
    paymentMethod: paymentMethod as "cod" | "cashfree",
    deliveryMethod: deliveryMethod as "standard" | "express" | "priority",
    contactEmail,
    coupon: coupon || undefined,
    notes: notes || undefined,
  };
}
