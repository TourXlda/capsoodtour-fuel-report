"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, User, Mail, Calendar, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase/client";

export function ProfileTab() {
  const router = useRouter();
  const [profile, setProfile] = useState<{ name: string; email: string; joined: string } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);

  useEffect(() => {
    async function getProfileData() {
      try {
        setIsLoading(true);

        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error || !user) {
          console.error("Error loading profile:", error?.message);
          return;
        }

        const meta = user.user_metadata || {};
        const identityMeta = user.identities?.[0]?.identity_data || {};

        let fullName = "";

        if (meta.first_name || meta.last_name) {
          fullName = `${meta.first_name || ""} ${meta.last_name || ""}`.trim();
        } else if (identityMeta.first_name || identityMeta.last_name) {
          fullName = `${identityMeta.first_name || ""} ${identityMeta.last_name || ""}`.trim();
        } else {
          fullName =
            meta.full_name ||
            meta.name ||
            user.email?.split("@")[0] ||
            "No Name Provided";
        }

        const emailAddress = user.email || "No Email Provided";

        const joinedDate = user.created_at
          ? new Date(user.created_at).toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })
          : "N/A";

        setProfile({
          name: fullName,
          email: emailAddress,
          joined: joinedDate,
        });
      } catch (err) {
        console.error("Error fetching profile data:", err);
      } finally {
        setIsLoading(false);
      }
    }

    void getProfileData();
  }, []);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await supabase.auth.signOut();
      router.refresh();
      router.push("/login");
    } catch (err) {
      console.error("Error during Logout:", err);
      setIsLoggingOut(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="border-grey-card-stroke rounded-2xl shadow-none max-w-2xl 2xl:max-w-3xl w-full bg-white dark:bg-card animate-pulse">
        <CardHeader className="p-5 sm:p-6 md:p-8 pb-3 sm:pb-4">
          <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-md w-1/3" />
        </CardHeader>
        <CardContent className="p-5 sm:p-6 md:p-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/4" />
                <div className="h-11 bg-slate-100 dark:bg-slate-900 border border-slate-200/60 rounded-xl w-full" />
              </div>
            ))}
          </div>
          <div className="pt-4">
            <div className="h-11 bg-slate-200 dark:bg-slate-800 rounded-xl w-full sm:w-32" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-grey-card-stroke rounded-2xl shadow-none max-w-2xl 2xl:max-w-3xl w-full bg-white dark:bg-card">
      <CardHeader className="p-5 sm:p-6 md:p-8 pb-2 sm:pb-3">
        <CardTitle>
          <Typography
            variant="h3"
            as="h2"
            className="text-text dark:text-card-foreground font-bold text-lg sm:text-xl md:text-2xl"
          >
            Personal Information
          </Typography>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-5 sm:p-6 md:p-8 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {/* Full Name Field */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <User className="w-3.5 h-3.5 shrink-0" />
              <Typography
                variant="body-semibold"
                className="text-xs font-bold uppercase tracking-wider"
              >
                Full Name
              </Typography>
            </div>
            <div className="p-3.5 border border-grey-card-stroke bg-slate-50/40 dark:bg-slate-900/40 rounded-xl text-text dark:text-foreground font-semibold text-xs sm:text-sm transition-all break-words">
              {profile?.name}
            </div>
          </div>

          {/* Email Field */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Mail className="w-3.5 h-3.5 shrink-0" />
              <Typography
                variant="body-semibold"
                className="text-xs font-bold uppercase tracking-wider"
              >
                Email Address
              </Typography>
            </div>
            <div className="p-3.5 border border-grey-card-stroke bg-slate-50/40 dark:bg-slate-900/40 rounded-xl text-text dark:text-foreground font-semibold text-xs sm:text-sm transition-all break-words">
              {profile?.email}
            </div>
          </div>

          {/* Member Since Field */}
          <div className="space-y-2 sm:col-span-2">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Calendar className="w-3.5 h-3.5 shrink-0" />
              <Typography
                variant="body-semibold"
                className="text-xs font-bold uppercase tracking-wider"
              >
                Member Since
              </Typography>
            </div>
            <div className="p-3.5 border border-grey-card-stroke bg-slate-50/40 dark:bg-slate-900/40 rounded-xl text-text dark:text-foreground font-semibold text-xs sm:text-sm transition-all w-full sm:w-1/2">
              {profile?.joined}
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <div className="pt-4 border-t border-grey-card-stroke flex justify-start">
          <Button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full sm:w-auto h-11 px-5 rounded-xl gap-2 font-bold text-xs sm:text-sm shadow-none transition-transform active:scale-[0.98]"
          >
            {isLoggingOut ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <LogOut className="w-4 h-4" />
            )}
            <Typography variant="button-semibold" className="text-white text-xs sm:text-sm">
              {isLoggingOut ? "Logging out..." : "Logout"}
            </Typography>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
