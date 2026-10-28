import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, test } from "node:test";
import { getPrisma } from "../../lib/db/prisma";
import { saveCategory, saveBrand, saveAttributeDefinition } from "../../lib/admin/catalog-admin";
import { createProduct, updateProduct } from "../../lib/admin/product-admin";
import { applyBulkProductAction } from "../../lib/admin/product-bulk";
import { getProductBySlug, listProducts } from "../../lib/db/products";

// CI database contract: never run these tests against a non-disposable database.
function verifyIsolation() {
  if (process.env.NEXORA_QA_ALLOW_DB_INTEGRATION !== "true") throw new Error("Explicit disposable QA database opt-in is required.");
  for (const envKey of ["DATABASE_URL", "DIRECT_URL"]) {
    const url = new URL(process.env[envKey] || "");
    if (!["localhost", "127.0.0.1", "::1", "[::1]"].includes(url.hostname)
      || url.pathname !== "/nexora_qa" || url.username !== "nexora_qa") {
      throw new Error("Refusing to run Admin database tests outside local isolated QA database.");
    }
  }
}
verifyIsolation();

const db = getPrisma();
const suffix = () => randomUUID().replaceAll("-", "").slice(0, 12);
const productIds: string[] = [];
const categoryIds: string[] = [];
const brandIds: string[] = [];

before(async () => { await db.$connect(); });
after(async () => {
  for (const id of productIds) await db.product.deleteMany({ where: { id } });
  for (const id of categoryIds) await db.category.deleteMany({ where: { id } });
  for (const id of brandIds) await db.brand.deleteMany({ where: { id } });
  await db.$disconnect();
});

async function catalogFixture() {
  const key = suffix();
  const category = await saveCategory(undefined, {
    name: "QA Electronics", slug: "qa-electronics-" + key,
    description: "Isolated test category", visible: true,
  });
  categoryIds.push(category.id);
  const brand = await saveBrand(undefined, {
    name: "QA Brand", slug: "qa-brand-" + key, active: true,
  });
  brandIds.push(brand.id);
  await saveAttributeDefinition(undefined, {
    categoryId: category.id, name: "Storage GB", type: "NUMBER", required: true,
  });
  await saveAttributeDefinition(undefined, {
    categoryId: category.id, name: "Case Color", type: "SELECT", options: ["Black", "Silver"], required: true,
  });
  await saveAttributeDefinition(undefined, {
    categoryId: category.id, name: "Waterproof", type: "BOOLEAN", required: false,
  });
  return { key, category, brand };
}

test("Admin Product create/update reload and storefront publication use real isolated PostgreSQL", async () => {
  const f = await catalogFixture();
  const input = {
    name: "QA Mobile " + f.key,
    sku: "QA-MOBILE-" + f.key,
    price: 1299,
    description: "Disposable catalog validation product",
    categorySlug: f.category.slug,
    brandSlug: f.brand.slug,
  };
  await assert.rejects(createProduct(input), /Storage GB is required/);
  assert.equal(await db.product.count({ where: { sku: input.sku } }), 0,
    "Required-attribute rejection must not create partial rows.");

  const product = await createProduct({
    ...input, description: " ", attributes: { "storage-gb": 128, "case-color": "Black", waterproof: false },
  });
  productIds.push(product.id);
  assert.equal(product.status, "DRAFT");
  assert.equal(product.description, input.name + " on NEXORA", "Empty optional description must get a safe default.");
  assert.deepEqual(await db.product.findUnique({ where: { id: product.id }, select: { attributes: true } }).then(p => p?.attributes),
    { "storage-gb": 128, "case-color": "Black", waterproof: false });
  assert.equal(await getProductBySlug(product.slug), null, "Draft products must remain private.");
  assert.equal((await listProducts({ query: input.sku })).total, 0);

  await updateProduct(product.id, {
    attributes: { "storage-gb": 256, "case-color": "Silver", waterproof: true },
    status: "ACTIVE",
  });
  const persisted = await db.product.findUniqueOrThrow({
    where: { id: product.id },
    include: { category: true, brand: true },
  });
  assert.equal(persisted.status, "ACTIVE");
  assert.equal(persisted.category?.slug, f.category.slug);
  assert.equal(persisted.brand?.slug, f.brand.slug);
  assert.deepEqual(persisted.attributes, { "storage-gb": 256, "case-color": "Silver", waterproof: true });
  const storefront = await getProductBySlug(product.slug);
  assert.equal(storefront?.id, product.id, "Published product must be resolvable on public product data path.");
  assert.equal((await listProducts({ query: input.sku })).total, 1);

  await updateProduct(product.id, { status: "DRAFT" });
  assert.equal(await getProductBySlug(product.slug), null, "Unpublishing must remove storefront visibility.");
});

test("Admin rejects invalid product attributes and inactive assignment without partial writes", async () => {
  const f = await catalogFixture();
  const sku = "QA-CHECK-" + f.key;
  const product = await createProduct({
    name: "QA Check " + f.key, sku, price: 100,
    categorySlug: f.category.slug, brandSlug: f.brand.slug,
    attributes: { "storage-gb": 64, "case-color": "Black" },
  });
  productIds.push(product.id);
  await assert.rejects(updateProduct(product.id, { attributes: { "storage-gb": 64, "case-color": "Gold" } }), /invalid value/);
  assert.deepEqual((await db.product.findUniqueOrThrow({ where: { id: product.id } })).attributes,
    { "storage-gb": 64, "case-color": "Black" });

  await saveBrand(f.brand.id, { active: false });
  await assert.rejects(createProduct({
    name: "QA Inactive Brand " + f.key, sku: "QA-INVALID-" + f.key,
    price: 150, categorySlug: f.category.slug, brandSlug: f.brand.slug,
    attributes: { "storage-gb": 64, "case-color": "Black" },
  }), /active brand/);
  assert.equal(await db.product.count({ where: { sku: "QA-INVALID-" + f.key } }), 0);
});


test("Single and bulk publish fail closed on newly required attributes or inactive classifications", async () => {
  const f = await catalogFixture();
  const row = await createProduct({
    name: "QA Publish Guard " + f.key, sku: "QA-PUBLISH-" + f.key,
    price: 449, categorySlug: f.category.slug, brandSlug: f.brand.slug,
    attributes: { "storage-gb": 64, "case-color": "Silver" },
  });
  productIds.push(row.id);
  await saveAttributeDefinition(undefined, {
    categoryId: f.category.id, name: "Warranty Months", type: "NUMBER", required: true,
  });
  await assert.rejects(updateProduct(row.id, { status: "ACTIVE" }), /Warranty Months is required/);
  await assert.rejects(applyBulkProductAction({
    action: "PUBLISH",
    products: [{ id: row.id, updatedAt: row.updatedAt.toISOString() }],
  }, "qa-owner-placeholder"), /Warranty Months is required/);
  assert.equal((await db.product.findUniqueOrThrow({ where: { id: row.id } })).status, "DRAFT");

  await updateProduct(row.id, {
    attributes: { "storage-gb": 64, "case-color": "Silver", "warranty-months": 12 },
  });
  await saveBrand(f.brand.id, { active: false });
  await assert.rejects(updateProduct(row.id, { status: "ACTIVE" }), /active brand/);
  const current = await db.product.findUniqueOrThrow({ where: { id: row.id } });
  await assert.rejects(applyBulkProductAction({
    action: "PUBLISH", products: [{ id: row.id, updatedAt: current.updatedAt.toISOString() }],
  }, "qa-owner-placeholder"), /active brand/);
  await saveBrand(f.brand.id, { active: true });
  await saveCategory(f.category.id, { visible: false });
  await assert.rejects(updateProduct(row.id, { status: "ACTIVE" }), /active, visible category/);
  await assert.rejects(applyBulkProductAction({
    action: "PUBLISH", products: [{ id: row.id, updatedAt: current.updatedAt.toISOString() }],
  }, "qa-owner-placeholder"), /active, visible category/);
  await saveCategory(f.category.id, { visible: true });
  const active = await updateProduct(row.id, { status: "ACTIVE" });
  assert.equal(active.status, "ACTIVE", "Valid product must still publish after classification restoration");
  await updateProduct(row.id, { status: "DRAFT" });
});
