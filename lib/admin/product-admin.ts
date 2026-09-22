import { randomUUID } from "node:crypto";
import { getPrisma } from "@/lib/db/prisma";

const slug = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export async function createProduct(input: Record<string, unknown>) {
  const name = String(input.name ?? "").trim();
  const sku = String(input.sku ?? "").trim().toUpperCase();
  const price = Number(input.price);

  if (name.length < 2 || sku.length < 3 || !Number.isFinite(price) || price < 0) {
    throw new Error("Invalid product details.");
  }

  return getPrisma().product.create({
    data: {
      id: randomUUID(),
      slug: `${slug(name)}-${randomUUID().slice(0, 6)}`,
      sku,
      name,
      description: String(input.description ?? `${name} on NEXORA`),
      priceMinor: Math.round(price * 100),
      status: input.status === "ACTIVE" ? "ACTIVE" : "DRAFT",
    },
  });
}

export async function updateProduct(id: string, input: Record<string, unknown>) {
  const data: {
    name?: string;
    priceMinor?: number;
    status?: "DRAFT" | "ACTIVE" | "ARCHIVED";
    featured?: boolean;
  } = {};

  if (typeof input.name === "string") data.name = input.name.trim();
  if (typeof input.price === "number") data.priceMinor = Math.round(input.price * 100);

  if (
    input.status === "DRAFT" ||
    input.status === "ACTIVE" ||
    input.status === "ARCHIVED"
  ) {
    data.status = input.status;
  }

  if (typeof input.featured === "boolean") data.featured = input.featured;

  return getPrisma().product.update({ where: { id }, data });
}
