import { createHash } from "node:crypto";

export type CloudinaryResourceType = "image" | "video";

function config() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      "Cloudinary upload is not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.",
    );
  }

  return { cloudName, apiKey, apiSecret };
}

export function cloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME?.trim() &&
      process.env.CLOUDINARY_API_KEY?.trim() &&
      process.env.CLOUDINARY_API_SECRET?.trim(),
  );
}

export function createCloudinaryUploadSignature(
  resourceType: CloudinaryResourceType,
) {
  const { cloudName, apiKey, apiSecret } = config();
  const timestamp = Math.floor(Date.now() / 1000);
  const folder =
    resourceType === "video"
      ? "nexora/products/videos"
      : "nexora/products/images";

  const signedParams = `folder=${folder}&timestamp=${timestamp}`;
  const signature = createHash("sha1")
    .update(`${signedParams}${apiSecret}`)
    .digest("hex");

  return {
    cloudName,
    apiKey,
    timestamp,
    folder,
    signature,
    resourceType,
  };
}
