"use client";

import { Download, Filter, Loader2, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Typography } from "@/components/ui/typography";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FilterDatePicker } from "@/components/dashboard/FilterDatePicker";
import type { FuelReportFilters } from "@/lib/services/admin/fuel-filters";
import { FormattedVehicle } from "@/types";

interface FuelExpenseFilterProps {
  filters: FuelReportFilters;
  onFiltersChange: (filters: FuelReportFilters) => void;
  onApply: () => void;
  onClear: () => void;
  onExportExcel?: () => void;
  isExporting?: boolean;
  hasAppliedFilters: boolean;
  vehicles: FormattedVehicle[];
  variant?: "admin" | "client";
}

export function FuelExpenseFilter({
  filters,
  onFiltersChange,
  onApply,
  onClear,
  onExportExcel,
  isExporting = false,
  hasAppliedFilters,
  vehicles,
  variant = "admin",
}: FuelExpenseFilterProps) {
  const isClientVariant = variant === "client";

  const updateFilter = <K extends keyof FuelReportFilters>(
    key: K,
    value: FuelReportFilters[K],
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <Card className="rounded-2xl gap-0 py-0 shadow-none border-grey-card-stroke overflow-hidden bg-white dark:bg-card w-full">
      <CardHeader className="px-4 sm:px-5 md:px-6 py-3.5 sm:py-4 border-b border-grey-card-stroke">
        <CardTitle className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-primary shrink-0" />
          <Typography
            variant="h3"
            as="h2"
            className="text-text dark:text-card-foreground font-bold text-base sm:text-lg md:text-xl"
          >
            {isClientVariant ? "Filter & Export Fuel History" : "Filter & Export Fuel Reports"}
          </Typography>
        </CardTitle>
        <Typography
          variant="muted-sm"
          className="text-muted-foreground text-xs sm:text-sm pt-0.5"
        >
          {isClientVariant
            ? "Filter your refuel entries, then export to Excel."
            : "Filter fuel expenses across drivers, vehicles, and date ranges, then export."}
        </Typography>
      </CardHeader>

      <CardContent className="px-4 sm:px-5 md:px-6 py-4 sm:py-5 space-y-4">
        <div
          className={cn(
            "grid w-full grid-cols-1 gap-3.5 sm:grid-cols-2 sm:gap-4",
            isClientVariant ? "lg:grid-cols-3" : "lg:grid-cols-4",
          )}
        >
          <FilterDatePicker
            id="filter-date-from"
            label="From Date"
            value={filters.dateFrom}
            onChange={(value) => updateFilter("dateFrom", value)}
          />

          <FilterDatePicker
            id="filter-date-to"
            label="To Date"
            value={filters.dateTo}
            minDate={filters.dateFrom || undefined}
            onChange={(value) => updateFilter("dateTo", value)}
          />

          <div className="min-w-0 w-full space-y-2">
            <label
              htmlFor="filter-vehicle"
              className="text-xs sm:text-sm font-semibold text-foreground block"
            >
              Vehicle
            </label>
            <Select
              value={filters.vehicleId || "all"}
              onValueChange={(value) => updateFilter("vehicleId", value)}
            >
              <SelectTrigger id="filter-vehicle" className="h-11 w-full text-xs sm:text-sm rounded-xl">
                <SelectValue placeholder="All Vehicles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Vehicles</SelectItem>
                {vehicles.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.name} ({v.plateNumber})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!isClientVariant && (
            <div className="min-w-0 w-full space-y-2">
              <label
                htmlFor="filter-driver"
                className="text-xs sm:text-sm font-semibold text-foreground block"
              >
                Driver Name
              </label>
              <Input
                id="filter-driver"
                type="text"
                placeholder="Search driver name"
                value={filters.driverName}
                onChange={(e) => updateFilter("driverName", e.target.value)}
                className="h-11 w-full text-xs sm:text-sm rounded-xl"
              />
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap gap-2.5 sm:gap-3 lg:justify-end pt-1">
          <Button
            type="button"
            variant="outline"
            onClick={onClear}
            className="h-11 rounded-xl font-bold w-full sm:w-auto sm:min-w-[104px] text-xs sm:text-sm transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5" />
            <Typography variant="button-semibold" className="text-xs sm:text-sm">
              Clear
            </Typography>
          </Button>
          <Button
            type="button"
            onClick={onApply}
            className="h-11 rounded-xl font-bold w-full sm:w-auto sm:min-w-[124px] text-xs sm:text-sm transition-all"
          >
            <Filter className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5" />
            <Typography variant="button-semibold" className="text-xs sm:text-sm text-white">
              Apply Filters
            </Typography>
          </Button>
          {onExportExcel && (
            <Button
              type="button"
              variant="secondary"
              onClick={onExportExcel}
              disabled={isExporting}
              className="h-11 rounded-xl font-bold w-full sm:w-auto sm:min-w-[132px] text-xs sm:text-sm transition-all"
            >
              {isExporting ? (
                <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin mr-1.5" />
              ) : (
                <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5" />
              )}
              <Typography variant="button-semibold" className="text-xs sm:text-sm">
                {isExporting ? "Exporting..." : "Export"}
              </Typography>
            </Button>
          )}
        </div>

        <Typography
          variant="muted-sm"
          className="text-muted-foreground text-xs pt-1 block"
        >
          {hasAppliedFilters
            ? "Filters are currently applied to the results below."
            : isClientVariant
              ? "Showing all of your recorded refuel entries."
              : "Showing all fuel reports."}
        </Typography>
      </CardContent>
    </Card>
  );
}
