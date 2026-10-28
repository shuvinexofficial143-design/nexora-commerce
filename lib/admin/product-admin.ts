import { randomUUID } from "node:crypto";
import { getPrisma } from "@/lib/db/prisma";
import { assertProductPublishable } from "@/lib/admin/product-publish";
import { requireAssignableBrand, requireAssignableCategory, validateProductAttributes } from "@/lib/admin/catalog-admin";
import type { Prisma } from "@/generated/prisma/client";
import {
  getYouTubeVideoId,
  isDirectVideoUrl,
  isSupportedPosterUrl,
  isSupportedProductVideoUrl,
  resolveProductMedia,
} from "@/lib/product-media";

type GalleryInput = { url: string; alt?: string };

export function normalizeGallery(value: unknown, productName: string) {
  if (!Array.isArray(value)) throw new Error("Product gallery must be an array.");
  const seen = new Set<string>();
  return value.map((item, index) => {
    const candidate = typeof item === "string" ? { url: item } : item as GalleryInput;
    const url = String(candidate?.url ?? "").trim();
    if (!isSupportedPosterUrl(url)) throw new Error("Gallery images must use HTTPS from Unsplash, YouTube, Cloudinary, or Supabase Storage.");
    if (seen.has(url)) throw new Error("Gallery images must be unique.");
    seen.add(url);
    return {
      url,
      alt: String(candidate?.alt ?? `${productName} image ${index + 1}`).trim() || `${productName} image ${index + 1}`,
      sortOrder: index + 10,
    };
  });
}

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
  const compareAt = input.compareAtPrice === "" || input.compareAtPrice == null ? null : Number(input.compareAtPrice);

  if (name.length < 2 || sku.length < 3 || !Number.isFinite(price) || price < 0 || (compareAt !== null && (!Number.isFinite(compareAt) || compareAt < price))) {
    throw new Error("Invalid product details.");
  }

  const media = resolveProductMedia({
    videoUrl: typeof input.videoUrl === "string" ? input.videoUrl : undefined,
    posterUrl: typeof input.posterUrl === "string" ? input.posterUrl : undefined,
  });
  const gallery = input.images === undefined ? [] : normalizeGallery(input.images, name);

  const prisma = getPrisma();

  return prisma.$transaction(async (tx) => {
    const categorySlug = typeof input.categorySlug === "string" ? input.categorySlug.trim().toLowerCase() : "";
    const brandSlug = typeof input.brandSlug === "string" ? input.brandSlug.trim().toLowerCase() : "";
    const categoryId = categorySlug ? requireAssignableCategory(await tx.category.findUnique({
      where: { slug: categorySlug }, select: { id: true, archived: true, visible: true },
    })) : null;
    const brandId = brandSlug ? requireAssignableBrand(await tx.brand.findUnique({
      where: { slug: brandSlug }, select: { id: true, active: true },
    })) : null;
    if (!categoryId && input.attributes !== undefined) throw new Error("Choose a category before adding product attributes.");
    const definitions = categoryId ? await tx.attributeDefinition.findMany({
      where: { categoryId },
      select: { slug: true, name: true, type: true, required: true, active: true, options: true },
    }) : [];
    // Enforce required attributes even when the incoming product omits an attributes field.
    const attributes = categoryId ? validateProductAttributes(definitions, input.attributes) : undefined;
    const product = await tx.product.create({
      data: {
        id: randomUUID(),
        slug: `${slug(name)}-${randomUUID().slice(0, 6)}`,
        sku,
        name,
        description: String(input.description ?? "").trim() || `${name} on NEXORA`,
        priceMinor: Math.round(price * 100),
        compareAtMinor: compareAt === null ? null : Math.round(compareAt * 100),
        status: input.status === "ACTIVE" ? "ACTIVE" : "DRAFT",
        ...(categoryId ? { category: { connect: { id: categoryId } } } : {}),
        ...(brandId ? { brand: { connect: { id: brandId } } } : {}),
        ...(attributes !== undefined ? { attributes: attributes as Prisma.InputJsonValue } : {}),
      },
    });

    const productMedia = [
      ...gallery.map((item) => ({ productId: product.id, ...item })),
      ...(media.posterUrl
        ? [{
            productId: product.id,
            url: media.posterUrl,
            alt: `${name} poster`,
            sortOrder: 0,
          }]
        : []),
      ...(media.videoUrl
        ? [{
            productId: product.id,
            url: media.videoUrl,
            alt: `${name} product video`,
            sortOrder: 1,
          }]
        : []),
    ];

    if (productMedia.length) {
      await tx.productImage.createMany({ data: productMedia });
    }

    return product;
  });
}

export async function updateProduct(id: string, input: Record<string, unknown>) {
  const data: {
    name?: string;
    priceMinor?: number;
    status?: "DRAFT" | "ACTIVE" | "ARCHIVED";
    featured?: boolean;
    description?: string;
    compareAtMinor?: number | null;
    categoryId?: string | null;
    brandId?: string | null;
    attributes?: Prisma.InputJsonValue;
  } = {};

  if (typeof input.name === "string") {
    const name = input.name.trim();
    if (name.length < 2) throw new Error("Product name is required.");
    data.name = name;
  }

  if (typeof input.price === "number") {
    if (!Number.isFinite(input.price) || input.price < 0) {
      throw new Error("Enter a valid product price.");
    }
    data.priceMinor = Math.round(input.price * 100);
  }

  if (typeof input.description === "string") {
    const description = input.description.trim();
    if (description.length < 2) throw new Error("Product description is required.");
    data.description = description;
  }

  if (input.compareAtPrice === "" || input.compareAtPrice === null) {
    data.compareAtMinor = null;
  } else if (typeof input.compareAtPrice === "number") {
    if (!Number.isFinite(input.compareAtPrice) || input.compareAtPrice < 0) throw new Error("Enter a valid compare-at price.");
    const price = typeof input.price === "number" ? input.price : undefined;
    if (price !== undefined && input.compareAtPrice < price) throw new Error("Compare-at price must be at least the selling price.");
    data.compareAtMinor = Math.round(input.compareAtPrice * 100);
  }

  if (
    input.status === "DRAFT" ||
    input.status === "ACTIVE" ||
    input.status === "ARCHIVED"
  ) {
    data.status = input.status;
  }

  if (typeof input.featured === "boolean") data.featured = input.featured;

  if (typeof input.categorySlug === "string") {
    const category = input.categorySlug.trim().toLowerCase();
    data.categoryId = category ? requireAssignableCategory(await getPrisma().category.findUnique({
      where: { slug: category }, select: { id: true, archived: true, visible: true },
    })) : null;
  }
  if (typeof input.brandSlug === "string") {
    const brand = input.brandSlug.trim().toLowerCase();
    data.brandId = brand ? requireAssignableBrand(await getPrisma().brand.findUnique({
      where: { slug: brand }, select: { id: true, active: true },
    })) : null;
  }
  if (input.attributes !== undefined) {
    if (data.categoryId === null) throw new Error("Choose a category before adding product attributes.");
    data.attributes = await resolveAttributes(input.attributes, typeof input.categorySlug === "string" ? input.categorySlug : undefined, id) as Prisma.InputJsonValue;
  } else if (data.categoryId !== undefined) {
    const previous = await getPrisma().product.findUniqueOrThrow({ where: { id }, select: { categoryId: true } });
    if (previous.categoryId !== data.categoryId) {
      // Never carry attribute values from an old category into an unrelated category.
      data.attributes = data.categoryId === null ? {} :
        await resolveAttributes({}, typeof input.categorySlug === "string" ? input.categorySlug : undefined, id) as Prisma.InputJsonValue;
    }
  }

  const mediaUpdateRequested =
    typeof input.videoUrl === "string" || typeof input.posterUrl === "string" || Array.isArray(input.images);
  const nextVideoUrl =
    typeof input.videoUrl === "string" ? input.videoUrl.trim() || null : undefined;
  const nextPosterUrl =
    typeof input.posterUrl === "string" ? input.posterUrl.trim() || null : undefined;
  const nextGallery = Array.isArray(input.images) ? normalizeGallery(input.images, typeof input.name === "string" ? input.name.trim() : "Product") : undefined;

  if (nextVideoUrl && !isSupportedProductVideoUrl(nextVideoUrl)) {
    throw new Error("Use a valid YouTube link or a direct HTTPS MP4/WebM/OGG/M4V/MOV URL.");
  }

  if (nextPosterUrl && !isSupportedPosterUrl(nextPosterUrl)) {
    throw new Error(
      "Poster image must use HTTPS from Unsplash, YouTube, Cloudinary, or Supabase Storage.",
    );
  }

  if (!Object.keys(data).length && !mediaUpdateRequested) {
    throw new Error("No product changes were provided.");
  }

  const prisma = getPrisma();

  return prisma.$transaction(async (tx) => {
    const product = Object.keys(data).length
      ? await tx.product.update({ where: { id }, data: data as Prisma.ProductUncheckedUpdateInput })
      : await tx.product.findUniqueOrThrow({ where: { id } });

    if (product.status === "ACTIVE") await assertProductPublishable(tx, product);

    if (mediaUpdateRequested) {
      const existing = await tx.productImage.findMany({
        where: { productId: id },
        orderBy: { sortOrder: "asc" },
      });

      const videoRecord = existing.find(
        (item) => isDirectVideoUrl(item.url) || Boolean(getYouTubeVideoId(item.url)),
      );
      const posterRecord = existing.find(
        (item) => item.sortOrder === 0 && !isDirectVideoUrl(item.url) && !getYouTubeVideoId(item.url),
      );

      if (nextGallery !== undefined) {
        await tx.productImage.deleteMany({
          where: { productId: id, id: { notIn: [videoRecord?.id, posterRecord?.id].filter((item): item is string => Boolean(item)) } },
        });
        if (nextGallery.length) {
          await tx.productImage.createMany({ data: nextGallery.map((item) => ({ productId: id, ...item })) });
        }
      }

      if (nextVideoUrl !== undefined) {
        if (nextVideoUrl === null) {
          if (videoRecord) await tx.productImage.delete({ where: { id: videoRecord.id } });
        } else if (videoRecord) {
          await tx.productImage.update({
            where: { id: videoRecord.id },
            data: { url: nextVideoUrl, alt: `${product.name} product video`, sortOrder: 1 },
          });
        } else {
          await tx.productImage.create({
            data: {
              productId: id,
              url: nextVideoUrl,
              alt: `${product.name} product video`,
              sortOrder: 1,
            },
          });
        }
      }

      if (nextPosterUrl !== undefined) {
        if (nextPosterUrl === null) {
          if (posterRecord) await tx.productImage.delete({ where: { id: posterRecord.id } });
        } else if (posterRecord) {
          await tx.productImage.update({
            where: { id: posterRecord.id },
            data: { url: nextPosterUrl, alt: `${product.name} poster`, sortOrder: 0 },
          });
        } else {
          await tx.productImage.create({
            data: {
              productId: id,
              url: nextPosterUrl,
              alt: `${product.name} poster`,
              sortOrder: 0,
            },
          });
        }
      }
    }

    return product;
  });
}

async function resolveAttributes(value: unknown, categorySlug?: string, productId?: string) {
  const prisma = getPrisma();
  let categoryId: string | undefined;
  if (categorySlug?.trim()) categoryId = (await prisma.category.findUniqueOrThrow({ where: { slug: categorySlug.trim().toLowerCase() }, select: { id: true } })).id;
  if (!categoryId && productId) categoryId = (await prisma.product.findUniqueOrThrow({ where: { id: productId }, select: { categoryId: true } })).categoryId ?? undefined;
  if (!categoryId) throw new Error("A category is required for product attributes.");
  const definitions = await prisma.attributeDefinition.findMany({ where: { categoryId }, select: { slug: true, name: true, type: true, required: true, active: true, options: true } });
  return validateProductAttributes(definitions, value);
}
