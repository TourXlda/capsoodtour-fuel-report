"use client";

import { Car, Fuel } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { Progress } from "@/components/ui/progress";
import { formatEuroAmount, formatLiters } from "@/lib/utils";
import type { VehicleCostBreakdown } from "@/lib/services/admin/fuel-filters";

interface CostByVehicleCardProps {
  data: VehicleCostBreakdown[];
  totalFuelCost: number;
}

export function CostByVehicleCard({ data, totalFuelCost }: CostByVehicleCardProps) {
  if (!data || data.length === 0) {
    return null;
  }

  return (
    <Card className="rounded-2xl shadow-none border-grey-card-stroke overflow-hidden bg-white dark:bg-card w-full">
      <CardHeader className="px-4 sm:px-5 md:px-6 py-3.5 sm:py-4 border-b border-grey-card-stroke">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Car className="w-5 h-5 text-primary shrink-0" />
            <CardTitle>
              <Typography
                variant="h3"
                as="h2"
                className="text-text dark:text-card-foreground font-bold text-base sm:text-lg md:text-xl"
              >
                Fuel Cost by Vehicle
              </Typography>
            </CardTitle>
          </div>
          <Typography
            variant="muted-sm"
            className="text-xs sm:text-sm font-semibold text-muted-foreground"
          >
            Total Spend: <span className="font-bold text-foreground">{formatEuroAmount(totalFuelCost)}</span>
          </Typography>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 md:p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-3.5 sm:gap-4">
          {data.map((item) => (
            <div
              key={item.vehicleId}
              className="p-3.5 sm:p-4 rounded-xl border border-grey-card-stroke bg-slate-50/50 dark:bg-slate-900/30 space-y-3 transition-all hover:border-slate-300"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <Typography
                    variant="body-semibold"
                    className="font-bold text-xs sm:text-sm text-foreground truncate block"
                  >
                    {item.vehicleName}
                  </Typography>
                  <div className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
                    Plate: <span className="font-mono font-bold text-foreground">{item.plateNumber}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <Typography
                    variant="body-bold"
                    className="text-xs sm:text-sm font-black text-foreground block leading-tight"
                  >
                    {formatEuroAmount(item.totalCost)}
                  </Typography>
                  <span className="text-[11px] font-bold text-primary block mt-0.5">
                    {item.percentage}% of total
                  </span>
                </div>
              </div>

              <Progress value={item.percentage} className="h-2" />

              <div className="flex items-center justify-between text-[11px] sm:text-xs text-muted-foreground pt-1 border-t border-slate-200/60 dark:border-slate-800">
                <span className="inline-flex items-center gap-1 font-medium">
                  <Fuel className="w-3.5 h-3.5 text-slate-400" />
                  {formatLiters(item.totalLiters)}
                </span>
                <span className="font-medium">
                  {item.entryCount} {item.entryCount === 1 ? "refuel" : "refuels"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
