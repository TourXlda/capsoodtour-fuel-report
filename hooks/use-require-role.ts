"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getDashboardPath, resolveAppRole, type AppRole } from "@/lib/auth";
import { supabase } from "@/lib/supabase/client";

export function useRequireRole(requiredRole: AppRole) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function verifyAccess() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (cancelled) return;

      if (!user) {
        setIsAuthorized(false);
        router.replace("/login");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (cancelled) return;

      if (profileError || !profile) {
        setIsAuthorized(false);
        router.replace("/login");
        return;
      }

      const role = resolveAppRole(profile.role);

      if (role !== requiredRole) {
        setIsAuthorized(false);
        router.replace(getDashboardPath(role));
        return;
      }

      setIsAuthorized(true);
    }

    void verifyAccess();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setIsAuthorized(false);
        router.replace("/login");
      }
    });

    const handlePopState = () => {
      void verifyAccess();
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      window.removeEventListener("popstate", handlePopState);
    };
  }, [requiredRole, router]);

  return isAuthorized;
}
