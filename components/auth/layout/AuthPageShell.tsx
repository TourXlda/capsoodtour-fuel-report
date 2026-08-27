import Link from "next/link";
import type { ReactNode } from "react";

import { Logo } from "@/components/brand/Logo";
import { Typography } from "@/components/ui/typography";

interface AuthPageShellProps {
  title: string;
  description: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthPageShell({
  title,
  description,
  children,
  footer,
}: AuthPageShellProps) {
  return (
    <div className="relative flex min-h-screen w-full flex-col bg-white">
      <div className="flex w-full flex-1 items-center justify-center px-4 py-8 sm:px-8 sm:py-10 lg:px-10">
        <div className="w-full max-w-[440px] min-w-0">
          <div className="flex flex-col gap-6">
            <div className="flex justify-center lg:justify-start">
              <Logo width={148} height={32} href="/" />
            </div>

            <div className="space-y-1 text-center lg:text-left">
              <Typography
                variant="h1"
                className="text-[28px] leading-9 sm:text-[36px] sm:leading-[44px]"
              >
                {title}
              </Typography>
              <Typography variant="muted" className="text-base sm:text-[18px]">
                {description}
              </Typography>
            </div>

            {children}

            {footer}
          </div>
        </div>
      </div>
    </div>
  );
}

export function AuthBackToLoginLink() {
  return (
    <div className="text-center lg:text-left">
      <Typography variant="muted-sm" className="text-muted-foreground">
        <Link
          href="/login"
          className="font-medium text-secondary-150 hover:underline"
        >
          Back to login
        </Link>
      </Typography>
    </div>
  );
}

export function AuthAlert({
  variant,
  children,
}: {
  variant: "error" | "success";
  children: ReactNode;
}) {
  const styles =
    variant === "error"
      ? "border-red-200 bg-red-50 text-red-600"
      : "border-green-200 bg-green-50 text-green-600";

  return (
    <div className={`rounded-lg border p-3 text-sm ${styles}`}>{children}</div>
  );
}
