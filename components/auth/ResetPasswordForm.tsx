"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Typography } from "@/components/ui/typography";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  AuthAlert,
  AuthPageShell,
} from "@/components/auth/layout/AuthPageShell";

import {
  ResetPasswordSchema,
  type ResetPasswordInput,
} from "@/lib/validations/auth/reset-password";
import {
  buildVerifyEmailPath,
  clearRecoveryState,
  getRecoveryEmail,
} from "@/lib/supabase/auth/recovery-storage";
import {
  getActiveSession,
  hasRecoveryHashInUrl,
  signOutUser,
  subscribeToAuthChanges,
  updatePassword,
} from "@/lib/supabase/auth/password-recovery";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [authError, setAuthError] = useState<string | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [canReset, setCanReset] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(ResetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    let cancelled = false;
    let accessGranted = false;

    const grantAccess = () => {
      if (cancelled || accessGranted) return;
      accessGranted = true;
      setCanReset(true);
      setIsCheckingSession(false);
    };

    const redirectToRecoveryStep = () => {
      if (cancelled || accessGranted) return;

      const email = getRecoveryEmail();
      router.replace(email ? buildVerifyEmailPath(email) : "/forget-password");
    };

    const {
      data: { subscription },
    } = subscribeToAuthChanges(async (event) => {
      if (event === "PASSWORD_RECOVERY") {
        grantAccess();
      }
    });

    async function validateRecoveryAccess() {
      await new Promise((resolve) => window.setTimeout(resolve, 150));

      const isEmailLinkRecovery = searchParams.get("recovery") === "1";

      if (hasRecoveryHashInUrl()) {
        const {
          data: { session },
        } = await getActiveSession();

        if (cancelled) return;

        if (session) {
          grantAccess();
        }

        return;
      }

      const {
        data: { session },
      } = await getActiveSession();

      if (cancelled) return;

      if (session && isEmailLinkRecovery) {
        grantAccess();
        return;
      }

      redirectToRecoveryStep();
    }

    validateRecoveryAccess();

    const fallbackTimer = window.setTimeout(() => {
      if (!cancelled && !accessGranted) {
        redirectToRecoveryStep();
      }
    }, 5000);

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      window.clearTimeout(fallbackTimer);
    };
  }, [router, searchParams]);

  const handleBackToLogin = async () => {
    clearRecoveryState();
    await signOutUser();
    router.replace("/login");
  };

  const onSubmit = async (data: ResetPasswordInput) => {
    try {
      setAuthError(null);

      const { error } = await updatePassword(data.password);

      if (error) {
        setAuthError(error.message || "Could not reset password.");
        return;
      }

      clearRecoveryState();
      await signOutUser();
      router.replace("/login");
    } catch {
      setAuthError("Something went wrong. Please try again.");
    }
  };

  if (isCheckingSession || !canReset) {
    return (
      <AuthPageShell
        title="Reset Password"
        description="Preparing password reset..."
      >
        <Typography variant="muted">Please wait...</Typography>
      </AuthPageShell>
    );
  }

  return (
    <AuthPageShell
      title="Reset Password"
      description="Your new password should be secure"
      footer={
        <div className="text-center lg:text-left">
          <Typography variant="muted-sm" className="text-muted-foreground">
            <button
              type="button"
              onClick={() => void handleBackToLogin()}
              className="font-medium text-secondary-150 hover:underline"
            >
              Back to login
            </button>
          </Typography>
        </div>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        {authError && <AuthAlert variant="error">{authError}</AuthAlert>}

        <FieldGroup className="gap-4">
          <Field data-invalid={!!errors.password}>
            <FieldLabel htmlFor="password">
              <Typography variant="body-regular" as="span">
                Password
              </Typography>
            </FieldLabel>
            <div className="relative flex items-center">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="at least 8 characters"
                autoComplete="new-password"
                className="pr-10"
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
            <FieldError>{errors.password?.message}</FieldError>
          </Field>

          <Field data-invalid={!!errors.confirmPassword}>
            <FieldLabel htmlFor="confirmPassword">
              <Typography variant="body-regular" as="span">
                Confirm password
              </Typography>
            </FieldLabel>
            <div className="relative flex items-center">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="at least 8 characters"
                autoComplete="new-password"
                className="pr-10"
                {...register("confirmPassword")}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
            <FieldError>{errors.confirmPassword?.message}</FieldError>
          </Field>
        </FieldGroup>

        <Button type="submit" disabled={isSubmitting} className="h-12 w-full">
          <Typography variant="button-medium" className="text-white">
            {isSubmitting ? "Resetting..." : "Reset password"}
          </Typography>
        </Button>
      </form>
    </AuthPageShell>
  );
}
