"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Typography } from "@/components/ui/typography";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import Link from "next/link";

import {
  AuthAlert,
  AuthPageShell,
} from "@/components/auth/layout/AuthPageShell";

import {
  RecoverSchema,
  type RecoverInput,
} from "@/lib/validations/auth/forget-password";
import {
  buildVerifyEmailPath,
  clearRecoveryState,
  normalizeRecoveryEmail,
  setRecoveryEmail,
  setRecoveryEmailSentAt,
} from "@/lib/supabase/auth/recovery-storage";
import { requestPasswordRecovery } from "@/lib/supabase/auth/password-recovery";

export function ForgetPasswordForm() {
  const router = useRouter();
  const [authError, setAuthError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RecoverInput>({
    resolver: zodResolver(RecoverSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: RecoverInput) => {
    const email = normalizeRecoveryEmail(data.email);

    try {
      setAuthError(null);
      clearRecoveryState();
      setRecoveryEmail(email);

      const { error } = await requestPasswordRecovery(email);

      // Always continue to verify screen to avoid email enumeration.
      // Only surface hard SMTP/config failures to the user.
      if (error) {
        const message = error.message.toLowerCase();
        const isConfigError =
          message.includes("smtp") ||
          message.includes("error sending") ||
          message.includes("rate limit");

        if (isConfigError) {
          clearRecoveryState();
          setAuthError(
            error.message ||
              "Could not send reset link. Please try again later.",
          );
          return;
        }
      }

      setRecoveryEmailSentAt();
      router.replace(buildVerifyEmailPath(email, "recovery"));
    } catch {
      clearRecoveryState();
      setAuthError("Something went wrong. Please try again.");
    }
  };

  return (
    <AuthPageShell
      title="Recover Account"
      description="Enter your registered email to receive a password reset link"
      footer={
        <div className="text-center lg:text-left">
          <Typography variant="muted-sm" className="text-muted-foreground">
            Remember your password?{" "}
            <Link
              href="/login"
              className="font-medium text-secondary-150 hover:underline"
            >
              Back to login
            </Link>
          </Typography>
        </div>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        {authError && <AuthAlert variant="error">{authError}</AuthAlert>}

        <FieldGroup>
          <Field data-invalid={!!errors.email}>
            <FieldLabel htmlFor="email">
              <Typography variant="body-regular" as="span">
                Email
              </Typography>
            </FieldLabel>
            <Input
              id="email"
              type="email"
              placeholder="Example@email.com"
              autoComplete="email"
              {...register("email")}
            />
            <FieldError>{errors.email?.message}</FieldError>
          </Field>
        </FieldGroup>

        <Button type="submit" disabled={isSubmitting} className="h-12 w-full">
          <Typography variant="button-medium">
            {isSubmitting ? "Sending..." : "Send reset link"}
          </Typography>
        </Button>
      </form>
    </AuthPageShell>
  );
}
