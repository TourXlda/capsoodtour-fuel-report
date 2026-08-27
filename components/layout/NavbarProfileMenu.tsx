"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  Loader2,
  LogOut,
  User,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/lib/supabase/client";
import { getDriverNameFromUser } from "@/lib/utils";

interface NavbarProfileMenuProps {
  role: "client" | "admin";
  onProfileClick?: () => void;
}

export function NavbarProfileMenu({
  role,
  onProfileClick,
}: NavbarProfileMenuProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [userName, setUserName] = useState("Profile");
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      setUserName(getDriverNameFromUser(user) || "Profile");
      setUserEmail(user.email ?? "");
    }

    void loadUser();
  }, []);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await supabase.auth.signOut();
      router.refresh();
      router.push("/login");
    } catch (err) {
      console.error("Logout failed:", err);
      setIsLoggingOut(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="h-10 rounded-lg gap-2 px-2 sm:px-4 active:scale-[0.98] transition-all"
        >
          <User className="h-4 w-4 shrink-0" />
          <span className="hidden sm:inline font-semibold text-sm truncate max-w-[140px]">
            {userName}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56 rounded-xl p-1.5">
        <DropdownMenuLabel className="px-2 py-2">
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-semibold text-foreground truncate">
              {userName}
            </span>
            {userEmail && (
              <span className="text-xs font-normal text-muted-foreground truncate">
                {userEmail}
              </span>
            )}
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {role === "client" && onProfileClick && (
          <>
            <DropdownMenuItem
              className="rounded-lg px-2 py-2 cursor-pointer"
              onClick={onProfileClick}
            >
              <User className="h-4 w-4 mr-2" />
              My Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        <DropdownMenuItem
          variant="destructive"
          className="rounded-lg px-2 py-2 cursor-pointer"
          disabled={isLoggingOut}
          onClick={handleLogout}
        >
          {isLoggingOut ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <LogOut className="h-4 w-4 mr-2" />
          )}
          {isLoggingOut ? "Logging out..." : "Logout"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
