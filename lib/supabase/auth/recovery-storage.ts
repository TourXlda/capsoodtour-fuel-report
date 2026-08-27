const RECOVERY_EMAIL_KEY = "capsood-fuel-report-recovery-email";
const RECOVERY_VERIFIED_KEY = "capsood-fuel-report-recovery-verified";
const RECOVERY_SENT_AT_KEY = "capsood-fuel-report-recovery-sent-at";
const LINK_EXPIRY_MINUTES = 15;

export function normalizeRecoveryEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function setRecoveryEmail(email: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(
    RECOVERY_EMAIL_KEY,
    normalizeRecoveryEmail(email),
  );
}

export function getRecoveryEmail(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(RECOVERY_EMAIL_KEY);
}

export function clearRecoveryEmail(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(RECOVERY_EMAIL_KEY);
}

export function setRecoveryVerified(): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(RECOVERY_VERIFIED_KEY, "true");
}

export function isRecoveryVerified(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(RECOVERY_VERIFIED_KEY) === "true";
}

export function clearRecoveryVerified(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(RECOVERY_VERIFIED_KEY);
}

export function clearRecoverySentAt(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(RECOVERY_SENT_AT_KEY);
}

export function clearRecoveryState(): void {
  clearRecoveryEmail();
  clearRecoveryVerified();
  clearRecoverySentAt();
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain || !local) return email;

  if (local.length <= 2) {
    return `${local[0] ?? ""}*@${domain}`;
  }

  const visibleEnd = local.slice(-1);
  const stars = "*".repeat(Math.min(local.length - 2, 4));
  return `${local[0]}${stars}${visibleEnd}@${domain}`;
}

const RECOVERY_RESET_PATH = "/reset-password?recovery=1";

export function getPasswordResetRedirectUrl(): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/auth/callback?next=${encodeURIComponent(RECOVERY_RESET_PATH)}`;
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const callbackPath = `/auth/callback?next=${encodeURIComponent(RECOVERY_RESET_PATH)}`;
  return siteUrl ? `${siteUrl}${callbackPath}` : callbackPath;
}

export function setRecoveryEmailSentAt(): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(RECOVERY_SENT_AT_KEY, Date.now().toString());
}

export function getRecoveryLinkExpirySeconds(): number {
  if (typeof window === "undefined") return LINK_EXPIRY_MINUTES * 60;

  const sentAt = sessionStorage.getItem(RECOVERY_SENT_AT_KEY);
  if (!sentAt) return LINK_EXPIRY_MINUTES * 60;

  const elapsedMs = Date.now() - Number(sentAt);
  const remainingMs = LINK_EXPIRY_MINUTES * 60 * 1000 - elapsedMs;
  return Math.max(0, Math.floor(remainingMs / 1000));
}

export function buildVerifyEmailPath(
  email: string,
  purpose: "recovery" | "signup" = "recovery",
): string {
  const params = new URLSearchParams({
    email: normalizeRecoveryEmail(email),
  });

  if (purpose === "signup") {
    params.set("type", "signup");
  }

  return `/verify-email?${params.toString()}`;
}
