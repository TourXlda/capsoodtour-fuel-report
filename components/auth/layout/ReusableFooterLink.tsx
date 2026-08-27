import Link from "next/link";

import { Typography } from "@/components/ui/typography";

interface FooterLinkProps {
  href: string;
  label: string;
  className?: string;
}

export function FooterLink({ href, label, className }: FooterLinkProps) {
  return (
    <Link href={href} className={className}>
      <Typography
        variant="body-semibold"
        className="text-primary hover:underline underline-offset-4"
      >
        {label}
      </Typography>
    </Link>
  );
}
