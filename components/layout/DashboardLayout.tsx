"use client";

import React, { createContext, useContext, useState } from "react";
import { Typography } from "@/components/ui/typography";

interface NavbarConfig {
  title: string;
  subtitle?: string;
  rightAction?: React.ReactNode;
}

interface LayoutContextType {
  setNavbarConfig: (config: NavbarConfig) => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export function DashboardLayoutProvider({ children }: { children: React.ReactNode }) {
  const [navbarConfig, setNavbarConfig] = useState<NavbarConfig>({
    title: "Dashboard",
  });

  return (
    <LayoutContext.Provider value={{ setNavbarConfig }}>
      <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/20 antialiased flex flex-col w-full">
        {/* Sticky Header Navbar */}
        <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)]">
          <div className="w-full max-w-7xl 2xl:max-w-[1536px] mx-auto px-3 sm:px-6 md:px-8 2xl:px-12 py-3.5 sm:py-4 flex items-center justify-between gap-2 sm:gap-4">
            <div className="space-y-0.5 min-w-0 flex-1">
              <Typography
                variant="h2"
                as="h1"
                className="text-foreground text-base sm:text-2xl md:text-3xl font-extrabold tracking-tight truncate leading-tight"
              >
                {navbarConfig.title}
              </Typography>
              {navbarConfig.subtitle && (
                <Typography
                  variant="muted-sm"
                  className="text-muted-foreground text-xs sm:text-sm truncate hidden sm:block font-medium"
                >
                  {navbarConfig.subtitle}
                </Typography>
              )}
            </div>
            {navbarConfig.rightAction && (
              <div className="flex items-center shrink-0">{navbarConfig.rightAction}</div>
            )}
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 w-full max-w-7xl 2xl:max-w-[1536px] mx-auto">
          {children}
        </main>
      </div>
    </LayoutContext.Provider>
  );
}

export function useNavbar() {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error("useNavbar must be used within a DashboardLayoutProvider");
  }
  return context;
}
