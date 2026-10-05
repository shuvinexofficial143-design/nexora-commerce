import { NextResponse } from "next/server";
import { ConflictError, DatabaseNotConfiguredError, NotFoundError, ValidationError } from "@/lib/db/errors";
import type { CreateOrderPayload } from "@/types/backend";

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
  const input = (value ?? {}) as Partial<CreateOrderPayload>;
  if (!Array.isArray(input.items) || input.items.length === 0) throw new ValidationError("Order must contain at least one item.");
  if (!input.shippingAddress || typeof input.shippingAddress !== "object") throw new ValidationError("Shipping address is required.");

  const items = input.items.map((item) => ({
    productId: String(item.productId ?? ""),
    quantity: Number(item.quantity ?? 0),
    variant: item.variant,
  }));
  if (items.some((item) => !item.productId || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 20)) {
    throw new ValidationError("Each order item needs a valid product and quantity between 1 and 20.");
  }

  const address = input.shippingAddress;
  for (const key of ["fullName", "phone", "line1", "city", "state", "postalCode"] as const) {
    if (!String(address[key] ?? "").trim()) throw new ValidationError(`Shipping ${key} is required.`);
  }

  const paymentMethod = String(input.paymentMethod ?? "cod").toLowerCase();
  if (paymentMethod !== "cod") {
    throw new ValidationError(
      "Online payments are not enabled yet. Choose Cash on Delivery to place this order.",
    );
  }

  const deliveryMethod = String(input.deliveryMethod ?? "standard").toLowerCase();
  if (!["standard", "express", "priority"].includes(deliveryMethod)) {
    throw new ValidationError("Choose a valid delivery method.");
  }

  return {
    items,
    shippingAddress: {
      fullName: String(address.fullName).trim(),
      phone: String(address.phone).trim(),
      line1: String(address.line1).trim(),
      line2: address.line2 ? String(address.line2).trim() : undefined,
      city: String(address.city).trim(),
      state: String(address.state).trim(),
      postalCode: String(address.postalCode).trim(),
      country: address.country ? String(address.country).trim() : "India",
    },
    paymentMethod: "cod",
    deliveryMethod: deliveryMethod as "standard" | "express" | "priority",
    coupon: input.coupon ? String(input.coupon).trim().toUpperCase().slice(0, 40) : undefined,
    notes: input.notes ? String(input.notes).slice(0, 500) : undefined,
  };
}
