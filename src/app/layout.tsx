import type { Metadata, Viewport } from "next";
import { Cairo } from "next/font/google";
import { Toaster } from "sonner";
import { Providers } from "@/components/providers";
import "./globals.css";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "بقال — نظام طلبات البقالة والميني ماركت",
  description: "خلي بقال العمارة يستقبل طلبات أونلاين",
  manifest: "/manifest.json",
  applicationName: "Baqal",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Baqal",
  },
};

export const viewport: Viewport = {
  themeColor: "#16A34A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#F8FAFC] text-gray-900 font-[family-name:var(--font-cairo)]">
        <Providers>{children}</Providers>
        <Toaster position="top-center" richColors dir="rtl" />
      </body>
    </html>
  );
}
