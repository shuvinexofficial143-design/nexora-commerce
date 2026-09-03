import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { hashPassword } from "../lib/auth/password";
import { catalogProducts } from "../lib/catalog-data";

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!connectionString) throw new Error("DIRECT_URL or DATABASE_URL is required to seed Prakriti Ganesh.");

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function titleCase(value: string) {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

async function main() {
  const demoPassword = "PrakritiDemo@123";
  const passwordHash = await hashPassword(demoPassword);

  const admin = await prisma.user.upsert({
    where: { email: "admin@prakritiganesh.demo" },
    update: { passwordHash, role: "ADMIN", status: "ACTIVE" },
    create: {
      email: "admin@prakritiganesh.demo",
      name: "Prakriti Ganesh Admin",
      passwordHash,
      role: "ADMIN",
    },
  });

  const customer = await prisma.user.upsert({
    where: { email: "customer@prakritiganesh.demo" },
    update: { passwordHash, status: "ACTIVE" },
    create: {
      email: "customer@prakritiganesh.demo",
      name: "Prakriti Customer",
      passwordHash,
      role: "CUSTOMER",
    },
  });

  const warehouse = await prisma.warehouse.upsert({
    where: { code: "UJN-01" },
    update: { active: true },
    create: {
      code: "UJN-01",
      name: "Ujjain Murti Fulfilment Centre",
      city: "Ujjain",
      state: "Madhya Pradesh",
    },
  });

  const categoryIds = new Map<string, string>();
  for (const categorySlug of [...new Set(catalogProducts.map((product) => product.category))]) {
    const category = await prisma.category.upsert({
      where: { slug: categorySlug },
      update: { name: titleCase(categorySlug) },
      create: { name: titleCase(categorySlug), slug: categorySlug },
    });
    categoryIds.set(categorySlug, category.id);
  }

  const brandIds = new Map<string, string>();
  for (const brandName of [...new Set(catalogProducts.map((product) => product.brand))]) {
    const brandSlug = slugify(brandName);
    const brand = await prisma.brand.upsert({
      where: { slug: brandSlug },
      update: { name: brandName },
      create: { name: brandName, slug: brandSlug },
    });
    brandIds.set(brandName, brand.id);
  }

  for (const item of catalogProducts) {
    const product = await prisma.product.upsert({
      where: { slug: item.slug },
      update: {
        sku: `PG-${item.id.replace("cat_", "").padStart(5, "0")}`,
        name: item.name,
        shortDescription: `${item.brand} ${titleCase(item.category)} eco-friendly Ganesh murti`,
        description: `${item.name} is part of the Prakriti Ganesh ${titleCase(item.category)} collection, curated for mindful Ganesh Chaturthi celebrations.`,
        priceMinor: Math.round(item.price * 100),
        compareAtMinor: item.compareAtPrice ? Math.round(item.compareAtPrice * 100) : null,
        rating: item.rating,
        reviewCount: item.reviews,
        status: "ACTIVE",
        featured: Boolean(item.badge),
        categoryId: categoryIds.get(item.category),
        brandId: brandIds.get(item.brand),
      },
      create: {
        id: item.id,
        slug: item.slug,
        sku: `PG-${item.id.replace("cat_", "").padStart(5, "0")}`,
        name: item.name,
        shortDescription: `${item.brand} ${titleCase(item.category)} eco-friendly Ganesh murti`,
        description: `${item.name} is part of the Prakriti Ganesh ${titleCase(item.category)} collection, curated for mindful Ganesh Chaturthi celebrations.`,
        priceMinor: Math.round(item.price * 100),
        compareAtMinor: item.compareAtPrice ? Math.round(item.compareAtPrice * 100) : null,
        rating: item.rating,
        reviewCount: item.reviews,
        status: "ACTIVE",
        featured: Boolean(item.badge),
        categoryId: categoryIds.get(item.category),
        brandId: brandIds.get(item.brand),
      },
    });

    await prisma.productImage.deleteMany({
      where: { productId: product.id },
    });

    await prisma.productImage.create({
      data: {
        productId: product.id,
        url: item.image,
        alt: item.name,
        sortOrder: 0,
      },
    });

    const stock =
      item.stock === "out-of-stock"
        ? 0
        : item.inventory > 0
          ? item.inventory
          : item.stock === "low-stock"
            ? 4
            : 30;

    await prisma.inventoryItem.upsert({
      where: {
        productId_warehouseId: {
          productId: product.id,
          warehouseId: warehouse.id,
        },
      },
      update: {
        onHand: stock,
        reserved: 0,
        reorderLevel: item.stock === "low-stock" ? 8 : 5,
      },
      create: {
        productId: product.id,
        warehouseId: warehouse.id,
        onHand: stock,
        reorderLevel: item.stock === "low-stock" ? 8 : 5,
      },
    });
  }

  await prisma.bulkEnquiry.deleteMany();
  await prisma.bulkEnquiry.createMany({
    data: [
      { name: "Rahul Joshi", organization: "Mahakal Residency", phone: "+91 98765 44210", city: "Ujjain", size: "24–30 inch", quantity: 2, budget: "₹12k–₹18k", requirement: "Natural clay finish for society installation", status: "NEW" },
      { name: "Neha Patil", organization: "Aarambh Tech", phone: "+91 97654 48321", email: "neha@example.com", city: "Indore", size: "Gifting minis", quantity: 60, budget: "₹25k–₹35k", requirement: "Office gifting packs with simple eco packaging", status: "CONTACTED" },
      { name: "Vikas Mehta", organization: "Shree Ganesh Mandal", phone: "+91 99887 71608", city: "Dewas", size: "30+ inch", quantity: 1, budget: "₹8k–₹12k", requirement: "Large Shadu Mati murti with protected transport", status: "QUOTED" },
    ],
  });

  console.log(`Seeded ${catalogProducts.length} Prakriti Ganesh products.`);
  console.log(`Seeded Prakriti Ganesh bulk enquiry demo queue.`);
  console.log(`Admin: ${admin.email}`);
  console.log(`Customer: ${customer.email}`);
}

main()
  .finally(async () => prisma.$disconnect())
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
