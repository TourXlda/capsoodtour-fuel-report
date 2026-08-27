"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

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

import { SignupSchema, type SignupInput } from "@/lib/validations/auth/signup";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { redirectAfterAuth } from "@/lib/auth";
import {
  checkUserEmailExists,
  normalizeAuthEmail,
} from "@/lib/supabase/auth/user-exists";
import {
  buildVerifyEmailPath,
  setRecoveryEmail,
  setRecoveryEmailSentAt,
} from "@/lib/supabase/auth/recovery-storage";
import { supabase } from "@/lib/supabase/client";

const EXISTING_ACCOUNT_MESSAGE =
  "Unable to create your account.";

export default function SignupForm() {
  const [authError, setAuthError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false); 
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupInput>({
    resolver: zodResolver(SignupSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
    
    },
  });



  const isLoading = isSubmitting || isRedirecting;

  const onSubmit = async (data: SignupInput) => {
    try {
      setAuthError(null);
      const email = normalizeAuthEmail(data.email);

      const emailAlreadyRegistered = await checkUserEmailExists(email);
      if (emailAlreadyRegistered === true) {
        setAuthError(EXISTING_ACCOUNT_MESSAGE);
        return;
      }

      const { data: signUpData, error } = await supabase.auth.signUp({
        email,
        password: data.password,
        options: {
          data: {
            first_name: data.firstName,
            last_name: data.lastName,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/login")}`,
        },
      });

      if (error) {
        const alreadyRegistered =
          error.message.toLowerCase().includes("already registered") ||
          error.message.toLowerCase().includes("user already");

        if (alreadyRegistered) {
          setAuthError(EXISTING_ACCOUNT_MESSAGE);
          return;
        }

        setAuthError(error.message);
        return;
      }

      if (signUpData?.user && signUpData.session === null) {
        const hasNewIdentity = (signUpData.user.identities?.length ?? 0) > 0;
        if (!hasNewIdentity) {
          setAuthError(EXISTING_ACCOUNT_MESSAGE);
          return;
        }

        setRecoveryEmail(email);
        setRecoveryEmailSentAt();
        setIsRedirecting(true);
        router.replace(buildVerifyEmailPath(email, "signup"));
        return;
      }

      setIsRedirecting(true);
      await redirectAfterAuth(router, "/login");
    } catch {
      setAuthError("An unexpected error occurred. Please try again.");
      setIsRedirecting(false);
    }
  };
  return (
    <div className="relative flex min-h-screen w-full flex-col bg-white">
      {/* Main Content Area */}
      <div className="flex w-full flex-1 items-center justify-center px-4 py-8 sm:px-8 sm:py-10 lg:px-10">
        <div className="w-full max-w-[440px] min-w-0">
          <div className="flex flex-col gap-6">
            {/* Logo: Responsive Alignment */}
            <div className="flex justify-center lg:justify-start">
              <Logo width={148} height={32} href="/" priority />
            </div>

            {/* Header Text - Responsive Alignment */}
            <div className="space-y-1 text-center lg:text-left">
              <Typography
                variant="h1"
                className="text-[28px] leading-9 sm:text-[36px] sm:leading-[44px]"
              >
                Welcome to Capsood Fuel Report
              </Typography>
              <Typography variant="muted" className="text-base sm:text-[18px]">
                Create an account to start your journey
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
              <FieldGroup className="gap-4">
                {/* Responsive Name Row */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field data-invalid={!!errors.firstName}>
                    <FieldLabel htmlFor="firstName">
                      <Typography variant="body-regular" as="span">
                        First Name
                      </Typography>
                    </FieldLabel>
                    <Input
                      id="firstName"
                      placeholder="Henry"
                      {...register("firstName")}
                    />
                    <FieldError>{errors.firstName?.message}</FieldError>
                  </Field>

                  <Field data-invalid={!!errors.lastName}>
                    <FieldLabel htmlFor="lastName">
                      <Typography variant="body-regular" as="span">
                        Last Name
                      </Typography>
                    </FieldLabel>
                    <Input
                      id="lastName"
                      placeholder="Mark"
                      {...register("lastName")}
                    />
                    <FieldError>{errors.lastName?.message}</FieldError>
                  </Field>
                </div>

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
                    {...register("email")}
                  />
                  <FieldError>{errors.email?.message}</FieldError>
                </Field>

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
                      className="w-full pr-10"
                      {...register("password")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 text-gray-500 hover:text-gray-700 focus:outline-none flex items-center justify-center"
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

                {/* CONFIRM PASSWORD FIELD */}
                <Field data-invalid={!!errors.confirmPassword}>
                  <FieldLabel htmlFor="confirmPassword">
                    <Typography variant="body-regular" as="span">
                      Confirm Password
                    </Typography>
                  </FieldLabel>

                  {/* Relative wrapper for responsiveness */}
                  <div className="relative flex items-center">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="at least 8 characters"
                      className=" pr-10" 
                      {...register("confirmPassword")}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 text-gray-500 hover:text-gray-700 focus:outline-none flex items-center justify-center"
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

              

              <Button
                type="submit"
                disabled={isLoading}
                className="h-12 w-full gap-2"
              >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                <Typography variant="button-medium" className="text-white">
                  {isRedirecting
                    ? "Redirecting..."
                    : isSubmitting
                      ? "Creating account..."
                      : "Sign up"}
                </Typography>
              </Button>
            </form>

            <div className="text-center">
              <Typography variant="muted-sm" className="text-muted-foreground">
                Already have account?{" "}
                <Link
                  href="/login"
                  className="font-medium text-secondary-150 hover:underline"
                >
                  Log in
                </Link>
              </Typography>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
