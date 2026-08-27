import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

/* ─── Roles & routes ─── */

export type AppRole = "admin" | "client";

export const GUEST_ONLY_ROUTES = ["/login", "/signup"] as const;

export const PROTECTED_ROUTES = [
  "/admin-dashboard",
  "/client-dashboard",
  "/fuel-report",
  "/success",
] as const;

export const CLIENT_ONLY_ROUTES = ["/fuel-report", "/success"] as const;

export function getDashboardPath(role: AppRole): string {
  return role === "admin" ? "/admin-dashboard" : "/fuel-report";
}

export function isGuestOnlyRoute(pathname: string): boolean {
  return GUEST_ONLY_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

export function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

export function isAdminDashboardRoute(pathname: string): boolean {
  return (
    pathname === "/admin-dashboard" ||
    pathname.startsWith("/admin-dashboard/")
  );
}

export function isClientDashboardRoute(pathname: string): boolean {
  return (
    pathname === "/client-dashboard" ||
    pathname.startsWith("/client-dashboard/")
  );
}

export function isClientOnlyRoute(pathname: string): boolean {
  return CLIENT_ONLY_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

export function resolveAppRole(role: string | null | undefined): AppRole {
  return role === "admin" ? "admin" : "client";
}

/* ─── Safe callback redirect (open-redirect protection) ─── */

const DEFAULT_RECOVERY_PATH = "/reset-password?recovery=1";

const ALLOWED_CALLBACK_PATHS = new Set([
  DEFAULT_RECOVERY_PATH,
  "/reset-password",
  "/client-dashboard",
  "/admin-dashboard",
  "/login",
  "/fuel-report",
]);

export function getSafeCallbackRedirectPath(
  next: string | null,
  fallback = DEFAULT_RECOVERY_PATH,
): string {
  if (!next) return fallback;

  if (!next.startsWith("/") || next.startsWith("//")) {
    return fallback;
  }

  const pathOnly = next.split("#")[0] ?? fallback;

  if (ALLOWED_CALLBACK_PATHS.has(pathOnly)) {
    return pathOnly;
  }

  const pathname = pathOnly.split("?")[0];
  if (pathname && ALLOWED_CALLBACK_PATHS.has(pathname)) {
    return pathOnly;
  }

  return fallback;
}

/* ─── Client navigation after auth ─── */

export async function redirectAfterAuth(
  router: AppRouterInstance,
  path: string,
) {
  router.refresh();
  router.replace(path);
}
