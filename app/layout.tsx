import type { Metadata, Viewport } from "next";
import "./globals.css";
import { CartProvider } from "@/components/cart/cart-provider";
import { AuthProvider } from "@/components/auth/auth-provider";
import { SiteChrome } from "@/components/layout/site-chrome";

export const metadata: Metadata = {
  title: { default: "Nexora Commerce — Shop Beyond Ordinary", template: "%s | Nexora Commerce" },
  description: "A premium AI-ready ecommerce experience for discovery, comparison and effortless checkout.",
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
