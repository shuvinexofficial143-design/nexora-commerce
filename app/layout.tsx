import type { Metadata, Viewport } from "next";
import "./globals.css";
import { CartProvider } from "@/components/cart/cart-provider";
import { AuthProvider } from "@/components/auth/auth-provider";
import { SiteChrome } from "@/components/layout/site-chrome";
import { getPublicAppUrl } from "@/lib/config/runtime";

export const metadata: Metadata = {
  metadataBase: new URL(getPublicAppUrl()),
  title: {
    default: "Nexora Commerce — Shop Beyond Ordinary",
    template: "%s | Nexora Commerce",
  },
  description:
    "A video-first ecommerce experience for product discovery, smart comparison and simple checkout.",
  applicationName: "Nexora Commerce",
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    siteName: "Nexora Commerce",
    title: "Nexora Commerce — Shop Beyond Ordinary",
    description:
      "A video-first ecommerce experience for product discovery, smart comparison and simple checkout.",
  },
  twitter: {
    card: "summary",
    title: "Nexora Commerce",
    description:
      "Video-first product discovery with simple checkout.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f8f8f6",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <CartProvider>
            <SiteChrome>{children}</SiteChrome>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
