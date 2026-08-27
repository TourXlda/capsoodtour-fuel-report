import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { getSafeCallbackRedirectPath } from "@/lib/auth";

const DEFAULT_RECOVERY_PATH = "/reset-password?recovery=1";

function isLoginNext(next: string): boolean {
  return next === "/login" || next.startsWith("/login?");
}

function isRecoveryNext(next: string): boolean {
  return (
    next.startsWith("/reset-password") ||
    next.includes("recovery=1")
  );
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = getSafeCallbackRedirectPath(
    searchParams.get("next"),
    DEFAULT_RECOVERY_PATH,
  );

  const loginAfterVerify = isLoginNext(next);
  const redirectTarget = loginAfterVerify
    ? `${origin}/login?verified=1`
    : `${origin}${next}`;

  let response = NextResponse.redirect(redirectTarget);

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
https://github.com/cyngro/Capsood-Fuel-Report/pull/5/conflict?name=public%252Fsw.js&ancestor_oid=6f1562d842b89a9e9ccc74346880883bd906ad60&base_oid=68ede3efccecb39f64b38af8f26434b2828a00b4&head_oid=052c65e36040e15495eb6a15abe000c7dce58890          response = NextResponse.redirect(redirectTarget);
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
      // Signup confirmation should end on login without an active session.
      if (loginAfterVerify && !isRecoveryNext(next)) {
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

    return NextResponse.redirect(`${origin}/forget-password`);
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

    return NextResponse.redirect(`${origin}/signup`);
  }

  return NextResponse.redirect(
    loginAfterVerify ? `${origin}/signup` : `${origin}/forget-password`,
  );
}
