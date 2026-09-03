import type { Metadata, Viewport } from "next";
import "./globals.css";
import { CartProvider } from "@/components/cart/cart-provider";
import { AuthProvider } from "@/components/auth/auth-provider";
import { SiteChrome } from "@/components/layout/site-chrome";

export const metadata: Metadata = {
  title: { default: "Prakriti Ganesh — Eco-Friendly Ganesh Murtis", template: "%s | Prakriti Ganesh" },
  description: "Handcrafted eco-friendly Ganesh murtis made with natural clay, thoughtful finishes and planet-friendly materials.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#fffaf0",
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
