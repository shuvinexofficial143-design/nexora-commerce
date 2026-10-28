import { randomUUID } from "node:crypto";
import { ValidationError } from "@/lib/db/errors";
import { Prisma } from "@/generated/prisma/client";
import { attributesForCategory,validateProductAttributes } from "@/lib/admin/product-attributes";
import { parseTaxonomySelection } from "@/lib/admin/product-taxonomy";
import { normalizeProductGallery,GALLERY_START,GALLERY_MAX } from "@/lib/admin/product-gallery";
import { getPrisma } from "@/lib/db/prisma";
import {
  getYouTubeVideoId,
  isDirectVideoUrl,
  isSupportedPosterUrl,
  isSupportedProductVideoUrl,
  resolveProductMedia,
} from "@/lib/product-media";

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
  const taxonomy = parseTaxonomySelection(input);
  const description = typeof input.description === "string" ? input.description.trim() : "";
  if (name.length < 2 || name.length > 160 || sku.length < 3 || sku.length > 80 ||
    !Number.isFinite(price) || price < 0 || price > 1_000_000 ||
    (description && description.length > 5000)) {
    throw new ValidationError("Invalid product details, price or description.");
  }

  const gallery=normalizeProductGallery(input.images??[],name);
  const media = resolveProductMedia({
    videoUrl: typeof input.videoUrl === "string" ? input.videoUrl : undefined,
    posterUrl: typeof input.posterUrl === "string" ? input.posterUrl : undefined,
  });

  const prisma = getPrisma();

  return prisma.$transaction(async (tx) => {
    const category = taxonomy.categorySlug ? await tx.category.findUnique({
      where: { slug: taxonomy.categorySlug }, select: { id: true },
    }) : null;
    const brand = taxonomy.brandSlug ? await tx.brand.findUnique({
      where: { slug: taxonomy.brandSlug }, select: { id: true },
    }) : null;
    if (taxonomy.categorySlug && !category) throw new ValidationError("Category no longer exists.");
    if (taxonomy.brandSlug && !brand) throw new ValidationError("Brand no longer exists.");
    if (!category && input.attributes !== undefined && Object.keys(input.attributes ?? {}).length)
      throw new ValidationError("Choose a category before adding specifications.");
    const definitions=category?await attributesForCategory(tx,category.id):[];
    const attributes=validateProductAttributes(definitions,input.attributes??{},
      input.status==="ACTIVE");
    const product = await tx.product.create({
      data: {
        id: randomUUID(),
        slug: `${slug(name)}-${randomUUID().slice(0, 6)}`,
        sku,
        name,
        description: description || `${name} on NEXORA`,
        priceMinor: Math.round(price * 100),
        status: input.status === "ACTIVE" ? "ACTIVE" : "DRAFT",
        categoryId: category?.id ?? null,
        brandId: brand?.id ?? null,
        attributes: attributes as Prisma.InputJsonValue,
      },
    });

    const productMedia = [
      ...gallery.map(image=>({productId:product.id,...image})),
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
    description?: string;
    priceMinor?: number;
    categoryId?: string | null;
    brandId?: string | null;
    attributes?: Prisma.InputJsonValue;
    status?: "DRAFT" | "ACTIVE" | "ARCHIVED";
    featured?: boolean;
  } = {};

  if (typeof input.name === "string") {
    const name = input.name.trim();
    if (name.length < 2 || name.length > 160) throw new ValidationError("Product name must be 2–160 characters.");
    data.name = name;
  }

  if (typeof input.price === "number") {
    if (!Number.isFinite(input.price) || input.price < 0 || input.price > 1_000_000) {
      throw new ValidationError("Enter a valid product price.");
    }
    data.priceMinor = Math.round(input.price * 100);
  }
  if (typeof input.description === "string") {
    const description = input.description.trim();
    if (!description || description.length > 5000)
      throw new ValidationError("Description must be 1–5000 characters.");
    data.description = description;
  }

  if (
    input.status === "DRAFT" ||
    input.status === "ACTIVE" ||
    input.status === "ARCHIVED"
  ) {
    data.status = input.status;
  }

  if (typeof input.featured === "boolean") data.featured = input.featured;

  const galleryUpdateRequested=input.images!==undefined;
  const gallery=galleryUpdateRequested?normalizeProductGallery(input.images,
    typeof input.name==="string"?input.name:"Product"):undefined;
  const mediaUpdateRequested = galleryUpdateRequested ||
    typeof input.videoUrl === "string" || typeof input.posterUrl === "string";
  const nextVideoUrl =
    typeof input.videoUrl === "string" ? input.videoUrl.trim() || null : undefined;
  const nextPosterUrl =
    typeof input.posterUrl === "string" ? input.posterUrl.trim() || null : undefined;

  if (nextVideoUrl && !isSupportedProductVideoUrl(nextVideoUrl)) {
    throw new Error("Use a valid YouTube link or a direct HTTPS MP4/WebM/OGG/M4V/MOV URL.");
  }

  if (nextPosterUrl && !isSupportedPosterUrl(nextPosterUrl)) {
    throw new Error(
      "Poster image must use HTTPS from Unsplash, YouTube, Cloudinary, or Supabase Storage.",
    );
  }

  const taxonomy = parseTaxonomySelection(input);
  if (!Object.keys(data).length && !mediaUpdateRequested &&
      taxonomy.categorySlug === undefined && taxonomy.brandSlug === undefined &&
      input.attributes === undefined) {
    throw new Error("No product changes were provided.");
  }

  const prisma = getPrisma();

  return prisma.$transaction(async (tx) => {
    const previous=await tx.product.findUniqueOrThrow({where:{id},select:{
      categoryId:true,attributes:true,status:true,
    }});
    if (taxonomy.categorySlug !== undefined) {
      if (!taxonomy.categorySlug) data.categoryId = null;
      else {
        const category = await tx.category.findUnique({
          where: { slug: taxonomy.categorySlug }, select: { id: true },
        });
        if (!category) throw new ValidationError("Category no longer exists.");
        data.categoryId = category.id;
      }
    }
    if (taxonomy.brandSlug !== undefined) {
      if (!taxonomy.brandSlug) data.brandId = null;
      else {
        const brand = await tx.brand.findUnique({
          where: { slug: taxonomy.brandSlug }, select: { id: true },
        });
        if (!brand) throw new ValidationError("Brand no longer exists.");
        data.brandId = brand.id;
      }
    }
    const nextCategoryId = data.categoryId === undefined ? previous.categoryId : data.categoryId;
    const nextStatus = data.status ?? previous.status;
    if (!nextCategoryId && input.attributes !== undefined &&
      Object.keys(input.attributes ?? {}).length)
      throw new ValidationError("Choose a category before adding specifications.");
    const switched = nextCategoryId!==previous.categoryId;
    // Category change invalidates old category-specific values. Never copy
    // unrelated values into new category definitions silently.
    const supplied = input.attributes !== undefined ? input.attributes :
      switched ? {} : previous.attributes ?? {};
    const definitions=nextCategoryId?await attributesForCategory(tx,nextCategoryId):[];
    const attributes=validateProductAttributes(definitions,supplied,
      nextStatus==="ACTIVE");
    data.attributes=attributes as Prisma.InputJsonValue;
    const product = Object.keys(data).length
      ? await tx.product.update({ where: { id }, data })
      : await tx.product.findUniqueOrThrow({ where: { id } });

    if (mediaUpdateRequested) {
      const existing = await tx.productImage.findMany({
        where: { productId: id },
        orderBy: { sortOrder: "asc" },
      });

      // Gallery images have sortOrder >= 10. Never select one as the
      // primary poster when editing/removing the poster independently.
      const videoRecord = existing.find((item)=>item.sortOrder<GALLERY_START &&
        (isDirectVideoUrl(item.url)||Boolean(getYouTubeVideoId(item.url))));
      const posterRecord = existing.find((item)=>item.sortOrder<GALLERY_START &&
        !isDirectVideoUrl(item.url) && !getYouTubeVideoId(item.url));

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

      if(gallery!==undefined){
        // Replace ONLY reserved gallery rows. Poster/video and unknown legacy
        // media rows are never affected, and failure rolls back all changes.
        await tx.productImage.deleteMany({where:{productId:id,
          sortOrder:{gte:GALLERY_START,lt:GALLERY_START+GALLERY_MAX}}});
        if(gallery.length)await tx.productImage.createMany({data:
          gallery.map(image=>({productId:id,...image}))});
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
