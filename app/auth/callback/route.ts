import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { getSafeCallbackRedirectPath } from "@/lib/auth";

const DEFAULT_RECOVERY_PATH = "/reset-password?recovery=1";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = getSafeCallbackRedirectPath(
    searchParams.get("next"),
    DEFAULT_RECOVERY_PATH,
  );

  const redirectToLoginAfterVerify =
    next === "/login" || next.startsWith("/login?");

  let response = NextResponse.redirect(
    redirectToLoginAfterVerify
      ? `${origin}/login?verified=1`
      : `${origin}${next}`,
  );

  const supabase = createServerClient(
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
          response = NextResponse.redirect(
            redirectToLoginAfterVerify
              ? `${origin}/login?verified=1`
              : `${origin}${next}`,
          );
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      if (redirectToLoginAfterVerify) {
        await supabase.auth.signOut();
      }
      return response;
    }
  }

  if (tokenHash && type === "recovery") {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: "recovery",
    });

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  if (tokenHash && (type === "signup" || type === "email")) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type === "signup" ? "signup" : "email",
    });

    if (!error) {
      await supabase.auth.signOut();
      return NextResponse.redirect(`${origin}/login?verified=1`);
    }
  }

  return NextResponse.redirect(`${origin}/forget-password`);
}
