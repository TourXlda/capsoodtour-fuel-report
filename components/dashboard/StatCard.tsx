"use client";

import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";

export interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  iconColorClass: string;
  bgColorClass: string;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  iconColorClass,
  bgColorClass,
}: StatCardProps) {
  return (
    <Card className="bg-white border border-grey-card-stroke dark:bg-card shadow-none rounded-2xl transition-all hover:border-slate-300 dark:hover:border-slate-700">
      <CardContent className="p-4 sm:p-5 md:p-6 flex items-center justify-between min-h-[96px] sm:min-h-[115px] gap-3">
        <div className="space-y-1 min-w-0 flex-1">
          <Typography
            variant="muted-sm"
            className="text-muted-foreground uppercase tracking-wider text-[11px] sm:text-xs font-bold truncate block"
          >
            {label}
          </Typography>
          <Typography
            variant="h2"
            className="text-xl sm:text-2xl md:text-3xl font-black text-foreground tracking-tight truncate leading-none"
          >
            {value}
          </Typography>
        </div>
        <div
          className={`p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl ${bgColorClass} ${iconColorClass} flex items-center justify-center shrink-0 shadow-sm`}
        >
          <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
      </CardContent>
    </Card>
  );
}
