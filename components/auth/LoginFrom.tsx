"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";

import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

import { LoginSchema, type LoginInput } from "@/lib/validations/auth/login";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { getDashboardPath, redirectAfterAuth, type AppRole } from "@/lib/auth";
import { normalizeAuthEmail } from "@/lib/supabase/auth/user-exists";
import { supabase } from "@/lib/supabase/client";

export default function LoginForm() {
  const [authError, setAuthError] = useState<string | null>(null);
  const [dismissVerifiedMessage, setDismissVerifiedMessage] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const successMessage =
    !dismissVerifiedMessage && searchParams.get("verified") === "1"
      ? "Email verified successfully. Please log in to continue."
      : null;
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const isLoading = isSubmitting || isRedirecting;

  const onSubmit = async (data: LoginInput) => {
    try {
      setAuthError(null);
      setDismissVerifiedMessage(true);
      const email = normalizeAuthEmail(data.email);

      const { data: authData, error: signInError } =
        await supabase.auth.signInWithPassword({
          email,
          password: data.password,
        });

      if (signInError || !authData?.user) {
        setAuthError(signInError?.message || "Invalid email or password.");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", authData.user.id)
        .single();

      if (profileError || !profile) {
        console.error("Error fetching user profile:", profileError?.message);
        setAuthError("Failed to verify user role configuration.");
        return;
      }

      const role: AppRole = profile.role === "admin" ? "admin" : "client";
      setIsRedirecting(true);
      await redirectAfterAuth(router, getDashboardPath(role));
    } catch {
      setAuthError("Something went wrong. Please try again.");
      setIsRedirecting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-white">
      <div className="flex w-full flex-1 items-center justify-center px-4 py-8 sm:px-8 sm:py-10 lg:px-10">
        <div className="w-full max-w-[440px] min-w-0">
          <div className="flex flex-col gap-6">
            <div className="flex justify-center lg:justify-start">
              <Logo width={148} height={32} href="/" priority />
            </div>

            <div className="space-y-1 text-center lg:text-left">
              <Typography
                variant="h1"
                className="text-[28px] leading-9 sm:text-[36px] sm:leading-[44px]"
              >
                Welcome Back!
              </Typography>
              <Typography variant="muted" className="text-base sm:text-[18px]">
                Log in to continue managing your trip{" "}
              </Typography>
            </div>

            <form
              onSubmit={handleSubmit(onSubmit)}
              className="flex flex-col gap-5"
            >
              {authError && (
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
                  {authError}
                </div>
              )}
              {successMessage && (
                <div className="p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg">
                  {successMessage}
                </div>
              )}
              <FieldGroup className="gap-4">
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
                    disabled={isLoading}
                    {...register("email")}
                  />
                  <FieldError>{errors.email?.message}</FieldError>
                </Field>

                <Field data-invalid={!!errors.password}>
                  <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                    <FieldLabel htmlFor="password">
                      <Typography variant="body-regular" as="span">
                        Password
                      </Typography>
                    </FieldLabel>
                    <Link href="/forget-password">
                      <Typography
                        variant="body-regular"
                        className="text-secondary-150 hover:underline"
                      >
                        Forgot password?
                      </Typography>
                    </Link>
                  </div>

                  <div className="relative flex items-center">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="at least 8 characters"
                      autoComplete="current-password"
                      className="pr-10"
                      disabled={isLoading}
                      {...register("password")}
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 text-gray-500 hover:text-gray-700 focus:outline-none"
                      disabled={isLoading}
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
              </FieldGroup>

              <Button
                type="submit"
                disabled={isLoading}
                className="h-12 w-full gap-2"
              >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                <Typography variant="button-medium">
                  {isRedirecting
                    ? "Redirecting..."
                    : isSubmitting
                      ? "Logging in..."
                      : "Log in"}
                </Typography>
              </Button>
            </form>

            <div className="text-center">
              <Typography variant="muted-sm" className="text-muted-foreground">
                Don&apos;t have an account?{" "}
                <Link
                  href="/signup"
                  className="font-medium text-secondary-150 hover:underline"
                >
                  Sign up
                </Link>
              </Typography>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
