import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import {
  getDashboardPath,
  isAdminDashboardRoute,
  isClientDashboardRoute,
  isClientOnlyRoute,
  isGuestOnlyRoute,
  isProtectedRoute,
  resolveAppRole,
  type AppRole,
} from "@/lib/auth";

function createSupabaseProxyClient(
  request: NextRequest,
  onResponseUpdate: (response: NextResponse) => void,
) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          const nextResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            nextResponse.cookies.set(name, value, options);
          });
          onResponseUpdate(nextResponse);
        },
      },
    },
  );
}

async function fetchUserRole(
  supabase: ReturnType<typeof createServerClient>,
  userId: string,
): Promise<AppRole | null> {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (error || !profile) return null;
  return resolveAppRole(profile.role);
}

/** Supabase env keys are configured — proxy-based session/role guarding is active */
const AUTH_PROXY_ENABLED = true;

export async function proxy(request: NextRequest) {
  if (!AUTH_PROXY_ENABLED) {
    return NextResponse.next({ request });
  }

  const { pathname } = request.nextUrl;

  let response = NextResponse.next({ request });
  const supabase = createSupabaseProxyClient(request, (nextResponse) => {
    response = nextResponse;
  });

  const guestRoute = isGuestOnlyRoute(pathname);
  const protectedRoute = isProtectedRoute(pathname);
  const clientOnlyRoute = isClientOnlyRoute(pathname);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    if (protectedRoute) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return response;
  }

  const needsRole =
    guestRoute ||
    isAdminDashboardRoute(pathname) ||
    isClientDashboardRoute(pathname) ||
    clientOnlyRoute;

  if (!needsRole) {
    return response;
  }

  const role = await fetchUserRole(supabase, user.id);

  if (!role) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (guestRoute) {
    return NextResponse.redirect(new URL(getDashboardPath(role), request.url));
  }

  if (isAdminDashboardRoute(pathname) && role !== "admin") {
    return NextResponse.redirect(new URL(getDashboardPath(role), request.url));
  }

  if (isClientDashboardRoute(pathname) && role !== "client") {
    return NextResponse.redirect(new URL(getDashboardPath(role), request.url));
  }

  if (clientOnlyRoute && role === "admin") {
    return NextResponse.redirect(new URL("/admin-dashboard", request.url));
  }

  if (protectedRoute) {
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  }

  return response;
}

export const config = {
  matcher: [
    "/login",
    "/signup",
    "/admin-dashboard",
    "/admin-dashboard/:path*",
    "/client-dashboard",
    "/client-dashboard/:path*",
    "/fuel-report",
    "/fuel-report/:path*",
    "/success",
    "/success/:path*",
  ],
};
