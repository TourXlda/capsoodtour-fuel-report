import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";

import { cn } from "@/lib/utils";

import { siteConfig } from "@/lib/config/site";

const LOGO_SRC = siteConfig.logo;
/** Intrinsic size of `public/images/logo.png` */
const LOGO_INTRINSIC = { width: 439, height: 98 } as const;

export type LogoProps = {
  width?: number;
  height?: number;

  href?: string | null;
  alt?: string;
  className?: string;
  priority?: boolean;
};

function resolveDisplayStyle(width?: number, height?: number): CSSProperties {
  if (width != null) {
    return { width, height: "auto" };
  }
  if (height != null) {
    return { width: "auto", height };
  }
  return { width: 148, height: "auto" };
}

export function Logo({
  width,
  height,
  href = "#",
  alt = "Capsood Fuel Report",
  className,
  priority = false,
}: LogoProps) {
  const displayStyle = resolveDisplayStyle(width, height);

  const image = (
    <Image
      src={LOGO_SRC}
      alt={alt}
      width={LOGO_INTRINSIC.width}
      height={LOGO_INTRINSIC.height}
      priority={priority}
      unoptimized
      style={displayStyle}
      className={cn("object-contain object-left", className)}
    />
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex shrink-0" aria-label={alt}>
        {image}
      </Link>
    );
  }

  return <span className="inline-flex shrink-0">{image}</span>;
}

export default Logo;
