import { randomUUID } from "node:crypto";
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

  if (name.length < 2 || sku.length < 3 || !Number.isFinite(price) || price < 0) {
    throw new Error("Invalid product details.");
  }

  const media = resolveProductMedia({
    videoUrl: typeof input.videoUrl === "string" ? input.videoUrl : undefined,
    posterUrl: typeof input.posterUrl === "string" ? input.posterUrl : undefined,
  });

  const prisma = getPrisma();

  return prisma.$transaction(async (tx) => {
    const product = await tx.product.create({
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

    const productMedia = [
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

  if (
    input.status === "DRAFT" ||
    input.status === "ACTIVE" ||
    input.status === "ARCHIVED"
  ) {
    data.status = input.status;
  }

  if (typeof input.featured === "boolean") data.featured = input.featured;

  const mediaUpdateRequested =
    typeof input.videoUrl === "string" || typeof input.posterUrl === "string";
  const nextVideoUrl =
    typeof input.videoUrl === "string" ? input.videoUrl.trim() || null : undefined;
  const nextPosterUrl =
    typeof input.posterUrl === "string" ? input.posterUrl.trim() || null : undefined;

  if (nextVideoUrl && !isSupportedProductVideoUrl(nextVideoUrl)) {
    throw new Error("Use a valid YouTube link or a direct MP4/WebM/OGG/M4V/MOV URL.");
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
      ? await tx.product.update({ where: { id }, data })
      : await tx.product.findUniqueOrThrow({ where: { id } });

    if (mediaUpdateRequested) {
      const existing = await tx.productImage.findMany({
        where: { productId: id },
        orderBy: { sortOrder: "asc" },
      });

      const videoRecord = existing.find(
        (item) => isDirectVideoUrl(item.url) || Boolean(getYouTubeVideoId(item.url)),
      );
      const posterRecord = existing.find(
        (item) => !isDirectVideoUrl(item.url) && !getYouTubeVideoId(item.url),
      );

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
