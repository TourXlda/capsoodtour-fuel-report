import React from "react";
import { ShieldCheck } from "lucide-react";
import { Typography } from "../ui/typography";

export default function AuthSidebar() {
  return (

    <aside className="relative hidden lg:block ">
      <div className="sticky top-0 h-screen w-full overflow-hidden flex flex-col bg-gradient-to-tr from-secondary/90 to-secondary p-12 justify-between">
        
        {/* Subtle Decorative Background Circles */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[350px] h-[350px] bg-black/5 rounded-full blur-2xl -ml-20 -mb-20 pointer-events-none" />

        

        {/* Center Main Feature Graphics & Illustration Card */}
        <div className="my-auto relative z-10 flex flex-col items-center w-full">
          
          {/* Inline Dashboard Status Mockup Element */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl max-w-[460px] w-full transform hover:scale-[1.02] transition-transform duration-300">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-white/60">
                    Live Analytics
                  </span>
                  <div className="h-4 w-28 bg-white/20 rounded-md animate-pulse" />
                </div>
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>

              {/* Status Graphic Rows */}
              <div className="space-y-2.5">
                <div className="h-8 w-full bg-white/20 rounded-xl flex items-center px-3 justify-between">
                  <div className="h-2 w-24 bg-white/40 rounded-sm" />
                  <div className="h-3 w-8 bg-emerald-400/40 border border-emerald-400 rounded-md" />
                </div>
                <div className="h-8 w-full bg-white/10 rounded-xl flex items-center px-3 justify-between">
                  <div className="h-2 w-32 bg-white/40 rounded-sm" />
                  <div className="h-3 w-8 bg-white/30 rounded-md" />
                </div>
              </div>
            </div>
          </div>

          {/* Core Sidebar Text Context */}
          <div className="text-center mt-10 max-w-[440px] space-y-3">
            <Typography variant="h3" className="text-white text-2xl font-bold tracking-tightLayout">
              Manage Fuel Reports Smoothly
            </Typography>
            <Typography variant="muted-sm" className="text-white/80 font-normal leading-relaxed text-[15px]">
              Log fuel expenses by vehicle and driver, track liters and distance, and export cost reports.
            </Typography>
          </div>
        </div>

        {/* Footer/Copyright Tag */}
        <div className="relative z-10 text-center">
          <Typography variant="muted-sm" className="text-white/60 text-xs font-normal">
            &copy; 2026 Capsood Fuel Report
          </Typography>
        </div>

      </div>
    </aside>
  );
}