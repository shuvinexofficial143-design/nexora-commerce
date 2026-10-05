import {
  adminFailure,
  adminJson,
  adminOptions,
  adminUnexpected,
  requireAdmin,
} from "@/lib/admin/admin-api";
import { cashfreeConfigured, cashfreeMode } from "@/lib/payments/cashfree";
import { cloudinaryConfigured } from "@/lib/media/cloudinary";
import { getPublicAppUrl } from "@/lib/config/runtime";

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
      app: {
        publicUrl: getPublicAppUrl(),
        environment:
          process.env.VERCEL_ENV ||
          process.env.NODE_ENV ||
          "development",
      },
      cashfree: {
        configured: cashfreeConfigured(),
        enabled:
          process.env.NEXT_PUBLIC_CASHFREE_ENABLED === "true",
        mode: cashfreeMode(),
      },
      cloudinary: {
        configured: cloudinaryConfigured(),
      },
      email: {
        configured: Boolean(
          process.env.RESEND_API_KEY?.trim() &&
            process.env.EMAIL_FROM?.trim(),
        ),
      },
      ai: {
        configured: Boolean(process.env.GROQ_API_KEY?.trim()),
        model: process.env.GROQ_MODEL?.trim() || null,
      },
    });
  } catch (error) {
    return adminUnexpected(request, error);
  }
}
