import type { Metadata } from "next";
import { Inter, Outfit, Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";
import StoreProvider from "@/components/providers/StoreProvider";
import AuthInitializer from "@/components/providers/AuthInitializer";
import Navbar from "@/components/layout/Navbar";
import LayoutWrapper from "@/components/layout/LayoutWrapper";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const beVietnam = Be_Vietnam_Pro({
  variable: "--font-be-vietnam",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "BookMyScreen - Đặt vé xem phim trực tuyến",
  description: "Đặt vé xem phim trực tuyến nhanh chóng, tiện lợi. Chọn phim, chọn rạp, chọn ghế và thanh toán ngay.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`${inter.variable} ${outfit.variable} ${beVietnam.variable} dark`} data-scroll-behavior="smooth">
      <body className="min-h-screen flex flex-col font-be-vietnam">
        <StoreProvider>
          <AuthInitializer>
            <LayoutWrapper>
              {children}
            </LayoutWrapper>
          </AuthInitializer>
          <Toaster richColors position="top-right" />
        </StoreProvider>
      </body>
    </html>
  );
}
