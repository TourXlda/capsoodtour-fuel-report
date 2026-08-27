import type { Metadata, Viewport } from "next";

import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { fontConfig } from "@/lib/config/fonts";
import { metadataIcons, siteConfig } from "@/lib/config/site";

export const viewport: Viewport = {
  themeColor: siteConfig.themeColor,
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: siteConfig.name,
  description: siteConfig.description,
  icons: metadataIcons,
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: siteConfig.shortName,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body
        className={`${fontConfig.className} font-sans antialiased`}
        suppressHydrationWarning
      >
        <main>{children}</main>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
