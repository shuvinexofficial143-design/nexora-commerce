import {
  adminFailure,
  adminJson,
  adminOptions,
  adminUnexpected,
  requireAdmin,
} from "@/lib/admin/admin-api";
import { cashfreeConfigured, cashfreeMode } from "@/lib/payments/cashfree";
import { cloudinaryConfigured } from "@/lib/media/cloudinary";
import { customerEmailConfigured } from "@/lib/notifications/customer-email";
import { deploymentInfo } from "@/lib/config/runtime";
import { storeProfileStatus } from "@/lib/config/store-profile";

export const runtime = "nodejs";

export function OPTIONS(request: Request) {
  return adminOptions(request);
}

export async function GET(request: Request) {
  try {
    const session = await requireAdmin(request);
    if (!session) {
      return adminFailure(request, "Admin authorization required.", 401);
    }

    return adminJson(request, {
      deployment: deploymentInfo(),
      storeProfile: storeProfileStatus(),
      integrations: {
        cashfree: {
          configured: cashfreeConfigured(),
          mode: cashfreeMode(),
          storefrontEnabled:
            process.env.NEXT_PUBLIC_CASHFREE_ENABLED === "true",
        },
        cloudinary: {
          configured: cloudinaryConfigured(),
        },
        email: {
          configured: customerEmailConfigured(),
          provider: "Resend",
        },
      },
    });
  } catch (error) {
    return adminUnexpected(request, error);
  }
}
