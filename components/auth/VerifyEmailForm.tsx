"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Clock } from "lucide-react";

import { Logo } from "@/components/brand/Logo";
import { Typography } from "@/components/ui/typography";
import { AuthAlert } from "@/components/auth/layout/AuthPageShell";

import {
  getRecoveryEmail,
  getRecoveryLinkExpirySeconds,
  normalizeRecoveryEmail,
  setRecoveryEmail,
  setRecoveryEmailSentAt,
} from "@/lib/supabase/auth/recovery-storage";
import { requestPasswordRecovery } from "@/lib/supabase/auth/password-recovery";
import { supabase } from "@/lib/supabase/client";

const RESEND_COOLDOWN_SECONDS = 60;

function formatCountdown(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isSignupFlow = searchParams.get("type") === "signup";
  const [email, setEmail] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [linkExpirySeconds, setLinkExpirySeconds] = useState(
    getRecoveryLinkExpirySeconds(),
  );
  const [resendCooldown, setResendCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    const fromUrl = searchParams.get("email");
    const fromStorage = getRecoveryEmail();
    const resolved = fromUrl
      ? normalizeRecoveryEmail(fromUrl)
      : fromStorage;

    if (!resolved) {
      router.replace(isSignupFlow ? "/signup" : "/forget-password");
      return;
    }

    setRecoveryEmail(resolved);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate email from URL/storage once
    setEmail(resolved);
    setIsReady(true);
  }, [router, searchParams, isSignupFlow]);

  useEffect(() => {
    if (linkExpirySeconds <= 0) return;

    const timer = window.setInterval(() => {
      setLinkExpirySeconds(getRecoveryLinkExpirySeconds());
    }, 1000);

    return () => window.clearInterval(timer);
  }, [linkExpirySeconds]);

  useEffect(() => {
    if (resendCooldown <= 0) return;

    const timer = window.setInterval(() => {
      setResendCooldown((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [resendCooldown]);

  const handleResend = async () => {
    if (!email || resendCooldown > 0 || isResending) return;

    try {
      setIsResending(true);
      setAuthError(null);
      setSuccessMessage(null);

      if (isSignupFlow) {
        const { error } = await supabase.auth.resend({
          type: "signup",
          email,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/login")}`,
          },
        });

        if (error) {
          setAuthError(error.message || "Could not resend verification link.");
          return;
        }

        setSuccessMessage("A new verification link has been sent to your email.");
      } else {
        const { error } = await requestPasswordRecovery(email);

        if (error) {
          setAuthError(error.message || "Could not resend reset link.");
          return;
        }

        setSuccessMessage("A new password reset link has been sent to your email.");
      }

      setRecoveryEmailSentAt();
      setLinkExpirySeconds(getRecoveryLinkExpirySeconds());
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
    } catch {
      setAuthError("Something went wrong. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  if (!isReady || !email) {
    return (
      <div className="relative flex min-h-screen w-full flex-col bg-white">
        <div className="flex w-full flex-1 items-center justify-center px-4 py-8 sm:px-8 sm:py-10 lg:px-10">
          <Typography variant="muted">Loading...</Typography>
        </div>
      </div>
    );
  }

  const expiryMinutes = Math.max(1, Math.ceil(linkExpirySeconds / 60));

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-white">
      <div className="flex w-full flex-1 items-center justify-center px-4 py-8 sm:px-8 sm:py-10 lg:px-10">
        <div className="w-full max-w-[440px] min-w-0">
          <div className="flex flex-col gap-6">
            <div className="flex justify-center lg:justify-start">
              <Logo width={148} height={32} href="/" />
            </div>

            <div className="space-y-1 text-center">
              <Typography
                variant="h1"
                className="text-[28px] leading-9 sm:text-[36px] sm:leading-[44px]"
              >
                Check Your Email
              </Typography>
              <div className="flex flex-col">
                <Typography variant="muted">
                  {isSignupFlow
                    ? "We have sent a verification link to"
                    : "We have sent a verification link to"}
                </Typography>
                <Typography variant="h3" className="text-[18px] break-all">
                  {email}
                </Typography>
              </div>
            </div>

            {authError && <AuthAlert variant="error">{authError}</AuthAlert>}
            {successMessage && (
              <AuthAlert variant="success">{successMessage}</AuthAlert>
            )}

            <div className="relative flex justify-center py-4">
              <div className="relative h-44 w-44">
                <Image
                  src="/images/verfiy-email.svg"
                  alt="Email Illustration"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 p-4">
              <Clock className="h-5 w-5 shrink-0 text-primary" />
              <Typography
                variant="body-semibold"
                className="text-muted-foreground"
              >
                This link expires in{" "}
                <Typography as="span" className="text-primary">
                  {linkExpirySeconds > 0
                    ? `${expiryMinutes} min${expiryMinutes === 1 ? "" : "s"}`
                    : "soon"}
                </Typography>
              </Typography>
            </div>

            <div className="space-y-2 text-center">
              <Typography variant="muted-sm">
                Didn&apos;t receive any link?
              </Typography>
              <button
                type="button"
                className="block w-full disabled:cursor-not-allowed disabled:opacity-60"
                onClick={handleResend}
                disabled={resendCooldown > 0 || isResending}
              >
                <Typography
                  variant="body-semibold"
                  className="text-primary hover:underline underline-offset-4"
                >
                  {isResending
                    ? "Sending..."
                    : resendCooldown > 0
                      ? `Resend ${formatCountdown(resendCooldown)}`
                      : "Resend link"}
                </Typography>
              </button>
            </div>

            <div className="text-center">
              <Typography variant="muted-sm" className="text-muted-foreground">
                <Link
                  href={isSignupFlow ? "/signup" : "/forget-password"}
                  className="font-medium hover:underline"
                >
                  Use a different email
                </Link>
                {" · "}
                <Link
                  href="/login"
                  className="font-medium text-secondary-150 hover:underline"
                >
                  Back to login
                </Link>
              </Typography>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
