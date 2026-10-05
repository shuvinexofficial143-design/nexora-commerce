import type { MetadataRoute } from "next";
import { getPublicAppUrl } from "@/lib/config/runtime";

export default function robots(): MetadataRoute.Robots {
  const base = getPublicAppUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/seller",
          "/api",
          "/account",
          "/login",
          "/register",
          "/forgot-password",
          "/reset-password",
          "/verify-otp",
          "/checkout",
          "/cart",
          "/track-order",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
