import type { MetadataRoute } from "next";

import { buildPwaIcons, siteConfig } from "@/lib/config/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteConfig.name,
    short_name: siteConfig.shortName,
    description: siteConfig.description,
    start_url: siteConfig.startUrl,
    display: "standalone",
    background_color: siteConfig.backgroundColor,
    theme_color: siteConfig.themeColor,
    orientation: "portrait",
    icons: buildPwaIcons(),
  };
}
