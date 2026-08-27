export type VerifyEmailPurpose = "signup" | "recovery";

const LOGIN_AFTER_VERIFY_PATH = "/login";
const RECOVERY_RESET_PATH = "/reset-password?recovery=1";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Prefer configured site URL (production), else current browser origin. */
export function getAppOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (configured) return configured;

  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return "";
}

export function buildAuthCallbackUrl(nextPath: string): string {
  const origin = getAppOrigin();
  const next = encodeURIComponent(nextPath);
  return `${origin}/auth/callback?next=${next}`;
}

export function getSignupConfirmRedirectUrl(): string {
  return buildAuthCallbackUrl(LOGIN_AFTER_VERIFY_PATH);
}

export function getPasswordResetRedirectUrl(): string {
  return buildAuthCallbackUrl(RECOVERY_RESET_PATH);
}

export function buildVerifyEmailPath(
  email: string,
  purpose: VerifyEmailPurpose = "recovery",
): string {
  const params = new URLSearchParams({
    email: normalizeEmail(email),
    type: purpose,
  });
  return `/verify-email?${params.toString()}`;
}

export function resolveVerifyEmailPurpose(
  value: string | null,
): VerifyEmailPurpose {
  return value === "signup" ? "signup" : "recovery";
}
