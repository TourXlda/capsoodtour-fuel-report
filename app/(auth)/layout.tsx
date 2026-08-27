import React from "react";
import AuthSidebar from "@/components/layout/AuthSidebar";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="grid min-h-screen min-w-0 lg:grid-cols-2">
      
      {/* Left Column: Sidebar (Hidden on mobile/tablet, occupies 50% width on desktop) */}
      <AuthSidebar />

      {/* Right Column: Form Frame (Occupies 100% on mobile, 50% width on desktop, independently scrollable) */}
      
        <div className="flex min-h-screen min-w-0 flex-col bg-background">
          {children}
        </div>

      
    </div>
  );
}