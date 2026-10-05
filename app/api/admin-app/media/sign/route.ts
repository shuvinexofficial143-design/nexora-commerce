import {
  adminFailure,
  adminJson,
  adminOptions,
  adminUnexpected,
  requireAdmin,
} from "@/lib/admin/admin-api";
import {
  cloudinaryConfigured,
  createCloudinaryUploadSignature,
  type CloudinaryResourceType,
} from "@/lib/media/cloudinary";

export const runtime = "nodejs";

export function OPTIONS(request: Request) {
  return adminOptions(request);
}

export async function POST(request: Request) {
  try {
    const session = await requireAdmin(request);
    if (!session) {
      return adminFailure(request, "Admin authorization required.", 401);
    }

    if (!cloudinaryConfigured()) {
      return adminFailure(
        request,
        "Cloudinary upload is not configured yet.",
        503,
      );
    }

    const body = (await request.json().catch(() => null)) as
      | { resourceType?: unknown }
      | null;
    const resourceType =
      body?.resourceType === "video" ? "video" : "image";

    return adminJson(
      request,
      createCloudinaryUploadSignature(
        resourceType as CloudinaryResourceType,
      ),
    );
  } catch (error) {
    return adminUnexpected(request, error);
  }
}
