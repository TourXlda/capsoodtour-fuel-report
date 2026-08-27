import type { Metadata, MetadataRoute } from "next";

export const siteConfig = {
  name: "Capsood Fuel Report",
  shortName: "Capsood Fuel",
  description:
    "Fuel expense reporting for Capsood — track vehicles, drivers, liters, pricing, distance, and export fuel reports.",
  logo: "/images/logo.png",
  favicon: "/images/icon.svg",
  faviconPng: "/images/icon.png",
  appleIcon: "/images/apple-icon.png",
  themeColor: "#ffffff",
  backgroundColor: "#ffffff",
  startUrl: "/login",
} as const;

export const faviconDimensions = {
  width: 31,
  height: 34,
} as const;

export const appleIconDimensions = {
  width: 180,
  height: 180,
} as const;

export const pwaIconSizes = [
  "48x48",
  "72x72",
  "96x96",
  "128x128",
  "144x144",
  "152x152",
  "192x192",
  "384x384",
  "512x512",
] as const;

export function buildPwaIcons(): MetadataRoute.Manifest["icons"] {
  const anyPurpose = pwaIconSizes.map((sizes) => ({
    src: siteConfig.faviconPng,
    sizes,
    type: "image/png" as const,
    purpose: "any" as const,
  }));

  return [
    ...anyPurpose,
    {
      src: siteConfig.faviconPng,
      sizes: "512x512",
      type: "image/png",
      purpose: "maskable",
    },
  ];
}

export const metadataIcons: Metadata["icons"] = {
  icon: [
    {
      url: siteConfig.favicon,
      type: "image/svg+xml",
      sizes: `${faviconDimensions.width}x${faviconDimensions.height}`,
    },
    {
      url: siteConfig.faviconPng,
      type: "image/png",
      sizes: "16x16",
    },
  ],
  shortcut: siteConfig.favicon,
  apple: {
    url: siteConfig.appleIcon,
    type: "image/png",
    sizes: `${appleIconDimensions.width}x${appleIconDimensions.height}`,
  },
};
