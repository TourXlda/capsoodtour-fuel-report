"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  DollarSign,
  Fuel,
  Gauge,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
  FileSpreadsheet,
  User,
} from "lucide-react";
import { useNavbar } from "@/components/layout/DashboardLayout";
import { NavbarProfileMenu } from "@/components/layout/NavbarProfileMenu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatsGrid } from "@/components/dashboard/StatsGrid";
import { GenericTable, type ColumnConfig } from "@/components/dashboard/GenericTable";
import { FuelExpenseFilter } from "@/components/dashboard/FuelExpenseFilter";
import { ProfileTab } from "@/components/dashboard/ProfileTab";
import { DeleteRecordButton } from "@/components/dashboard/DeleteRecordButton";
import { Typography } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase/client";
import { useRequireRole } from "@/hooks/use-require-role";
import type {
  FuelExpenseWithVehicleRow,
  FormattedVehicle,
  AdminFuelExpense,
  FuelAnalyticsData,
  FuelReportFilters,
} from "@/types";
import { deleteFuelExpense, deleteFuelExpenses } from "@/lib/services/fuel/fuel-expenses";
import {
  EMPTY_FUEL_REPORT_FILTERS,
  fetchClientFuelExpensesPage,
  fetchClientFuelAnalytics,
  fetchFuelExpensesForExport,
  formatAdminFuelExpense,
} from "@/lib/services/admin/fuel-filters";
import { fetchActiveVehicles } from "@/lib/services/vehicles";
import { downloadFuelReportsExcel } from "@/lib/services/export/fuel-reports-xlsx";
import { formatEuroAmount, formatLiters, formatConsumption } from "@/lib/utils";
import { toast } from "sonner";

function filtersAreActive(filters: FuelReportFilters): boolean {
  return Boolean(
    filters.dateFrom ||
      filters.dateTo ||
      (filters.vehicleId && filters.vehicleId !== "all"),
  );
}

export default function ClientDashboard() {
  const isAuthorized = useRequireRole("client");
  const [activeTab, setActiveTab] = useState<"expenses" | "profile">("expenses");
  const [expenses, setExpenses] = useState<AdminFuelExpense[]>([]);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [analytics, setAnalytics] = useState<FuelAnalyticsData>({
    totalFuelCost: 0,
    totalLiters: 0,
    totalDistance: 0,
    avgConsumption: 0,
    costPerKm: 0,
    costByVehicle: [],
    entryCount: 0,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const [draftFilters, setDraftFilters] = useState<FuelReportFilters>(EMPTY_FUEL_REPORT_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<FuelReportFilters>(EMPTY_FUEL_REPORT_FILTERS);
  const [vehicles, setVehicles] = useState<FormattedVehicle[]>([]);

  const [deletingExpenseId, setDeletingExpenseId] = useState<string | null>(null);
  const [selectedExpenseIds, setSelectedExpenseIds] = useState<Set<string>>(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const { setNavbarConfig } = useNavbar();
  const pageSize = 10;

  const loadVehicles = useCallback(async () => {
    try {
      const { data } = await fetchActiveVehicles();
      if (data) setVehicles(data);
    } catch (err) {
      console.error("Failed to load vehicles:", err);
    }
  }, []);

  const fetchUserFuelData = useCallback(
    async (currentPage: number, filters: FuelReportFilters) => {
      try {
        setIsLoading(true);

        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          console.error("Auth error or user unauthenticated:", authError?.message);
          setIsLoading(false);
          return;
        }

        const [pageRes, analyticsRes] = await Promise.all([
          fetchClientFuelExpensesPage(user.id, currentPage, pageSize, filters),
          fetchClientFuelAnalytics(user.id, filters),
        ]);

        if (pageRes.error) {
          console.error("Error fetching client fuel expenses:", pageRes.error.message);
          setIsLoading(false);
          return;
        }

        const formatted = (
          (pageRes.data as unknown as FuelExpenseWithVehicleRow[] | null) ?? []
        ).map((row) => formatAdminFuelExpense(row));

        setExpenses(formatted);
        setTotalCount(pageRes.count || 0);
        setSelectedExpenseIds(new Set());

        if (!analyticsRes.error && analyticsRes.data) {
          setAnalytics(analyticsRes.data);
        }
      } catch (err) {
        console.error("Unexpected error loading client dashboard:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [pageSize],
  );

  useEffect(() => {
    if (!isAuthorized) return;
    const timer = window.setTimeout(() => {
      void loadVehicles();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [isAuthorized, loadVehicles]);

  useEffect(() => {
    if (!isAuthorized) return;
    const timer = window.setTimeout(() => {
      void fetchUserFuelData(page, appliedFilters);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [isAuthorized, page, appliedFilters, fetchUserFuelData]);

  const handleDeleteExpense = async (id: string) => {
    try {
      setDeletingExpenseId(id);
      const result = await deleteFuelExpense(id);

      if (!result.success) {
        toast.error("Failed to delete fuel expense", { description: result.message });
        return;
      }

      toast.success("Fuel expense deleted successfully");
      setSelectedExpenseIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });

      await fetchUserFuelData(page, appliedFilters);
    } catch (err) {
      console.error("Delete expense error:", err);
      toast.error("Failed to delete fuel expense");
    } finally {
      setDeletingExpenseId(null);
    }
  };

  const handleBulkDeleteExpenses = async () => {
    const ids = Array.from(selectedExpenseIds);
    if (ids.length === 0) return;

    try {
      setIsBulkDeleting(true);
      const result = await deleteFuelExpenses(ids);

      if (!result.success) {
        toast.error("Failed to delete selected expenses", { description: result.message });
        return;
      }

      toast.success(`${result.deletedCount} expense(s) deleted successfully`);
      setSelectedExpenseIds(new Set());
      await fetchUserFuelData(page, appliedFilters);
    } catch (err) {
      console.error("Bulk delete error:", err);
      toast.error("Failed to delete selected expenses");
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const toggleExpenseSelection = (id: string, checked: boolean) => {
    setSelectedExpenseIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const toggleSelectAllExpenses = (checked: boolean) => {
    if (checked) {
      setSelectedExpenseIds(new Set(expenses.map((e) => e.id)));
    } else {
      setSelectedExpenseIds(new Set());
    }
  };

  const handleApplyFilters = () => {
    setExportError("");
    setPage(1);
    setAppliedFilters({ ...draftFilters });
  };

  const handleClearFilters = () => {
    setExportError("");
    setPage(1);
    setDraftFilters(EMPTY_FUEL_REPORT_FILTERS);
    setAppliedFilters(EMPTY_FUEL_REPORT_FILTERS);
  };

  const handleExportExcel = async () => {
    try {
      setExportError("");
      setIsExporting(true);

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        setExportError("You must be signed in to export your fuel records.");
        toast.error("Export failed", { description: "Please sign in again." });
        return;
      }

      const { data, error } = await fetchFuelExpensesForExport(appliedFilters, user.id);

      if (error) {
        setExportError(error.message);
        toast.error("Export failed", { description: error.message });
        return;
      }

      const rows = (data as unknown as FuelExpenseWithVehicleRow[] | null) ?? [];

      if (rows.length === 0) {
        setExportError("No fuel records found for the selected filters.");
        toast.warning("No records found to export");
        return;
      }

      downloadFuelReportsExcel(rows, "my-fuel-reports");
      toast.success("Excel file downloaded successfully");
    } catch (err) {
      console.error("Export failed:", err);
      setExportError("Failed to export your fuel records. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const allExpensesSelected =
    expenses.length > 0 && expenses.every((e) => selectedExpenseIds.has(e.id));
  const someExpensesSelected =
    expenses.some((e) => selectedExpenseIds.has(e.id)) && !allExpensesSelected;
  const selectedExpenseCount = selectedExpenseIds.size;

  useEffect(() => {
    if (!isAuthorized) return;

    setNavbarConfig({
      title: "Driver Fuel Dashboard",
      subtitle: "Track your refuel history, vehicle usage, and submit fuel expenses",
      rightAction: (
        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/fuel-report">
            <Button size="default" className="h-10 px-3 sm:px-4 rounded-xl font-bold gap-1.5 shadow-none">
              <Plus className="w-4 h-4 shrink-0" />
              <Typography variant="button-semibold" className="text-white text-xs sm:text-sm">
                <span className="sm:hidden">Report</span>
                <span className="hidden sm:inline">Report Fuel Expense</span>
              </Typography>
            </Button>
          </Link>
          <NavbarProfileMenu
            role="client"
            onProfileClick={() => setActiveTab("profile")}
          />
        </div>
      ),
    });
  }, [isAuthorized, setNavbarConfig]);

  const clientStats = [
    {
      label: "Total Fuel Spend",
      value: formatEuroAmount(analytics.totalFuelCost),
      icon: DollarSign,
      iconColorClass: "text-emerald-600",
      bgColorClass: "bg-emerald-50/70 border-emerald-100",
    },
    {
      label: "Total Liters Refueled",
      value: formatLiters(analytics.totalLiters),
      icon: Fuel,
      iconColorClass: "text-blue-600",
      bgColorClass: "bg-blue-50/70 border-blue-100",
    },
    {
      label: "Avg Consumption",
      value: formatConsumption(analytics.avgConsumption),
      icon: Gauge,
      iconColorClass: "text-indigo-600",
      bgColorClass: "bg-indigo-50/70 border-indigo-100",
    },
    {
      label: "Cost Per Kilometer",
      value:
        analytics.costPerKm > 0
          ? `${formatEuroAmount(analytics.costPerKm)}/km`
          : "—",
      icon: TrendingUp,
      iconColorClass: "text-amber-600",
      bgColorClass: "bg-amber-50/70 border-amber-100",
    },
  ];

  const clientColumns: ColumnConfig<AdminFuelExpense>[] = [
    {
      header: "Date",
      accessorKey: "date",
      renderCell: (e) => (
        <span className="font-bold text-xs xl:text-sm text-foreground">{e.date}</span>
      ),
    },
    {
      header: "Vehicle & Plate",
      accessorKey: "vehicleName",
      renderCell: (e) => (
        <div className="inline-block text-center">
          <div className="font-bold text-xs xl:text-sm text-foreground">{e.vehicleName}</div>
          <div className="font-mono text-[11px] xl:text-xs text-muted-foreground">{e.plateNumber}</div>
        </div>
      ),
    },
    {
      header: "Odometer",
      accessorKey: "odometer",
      renderCell: (e) => (
        <span className="font-mono text-xs xl:text-sm font-semibold text-foreground">
          {e.odometerFormatted}
        </span>
      ),
    },
    {
      header: "Volume / Price",
      accessorKey: "liters",
      renderCell: (e) => (
        <div className="inline-block text-center">
          <span className="font-bold text-xs xl:text-sm text-foreground">{e.litersFormatted}</span>
          <span className="text-[11px] xl:text-xs text-muted-foreground block">
            @ {e.pricePerLiterFormatted}/L
          </span>
        </div>
      ),
    },
    {
      header: "Total Cost",
      accessorKey: "totalAmount",
      renderCell: (e) => (
        <span className="font-bold text-xs xl:text-sm text-foreground">{e.totalAmountFormatted}</span>
      ),
    },
    {
      header: "Notes",
      accessorKey: "notes",
      renderCell: (e) => (
        <Typography
          variant="muted-sm"
          className="text-muted-foreground text-xs xl:text-sm max-w-[160px] xl:max-w-[200px] mx-auto line-clamp-2 whitespace-normal break-words overflow-hidden"
          title={e.notes !== "—" ? e.notes : undefined}
        >
          {e.notes}
        </Typography>
      ),
    },
    {
      header: "Actions",
      accessorKey: "id",
      renderCell: (e) => (
        <DeleteRecordButton
          label={`Delete expense on ${e.date}`}
          title="Delete fuel expense record?"
          description="This will permanently remove your fuel refill record. This action cannot be undone."
          isDeleting={deletingExpenseId === e.id}
          onConfirm={() => handleDeleteExpense(e.id)}
        />
      ),
    },
  ];

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="px-3 sm:px-6 md:px-8 2xl:px-12 py-4 sm:py-6 md:py-8 space-y-6 md:space-y-8 w-full mx-auto overflow-x-hidden">
      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as "expenses" | "profile")}
        className="w-full space-y-6"
      >
        <div className="w-full overflow-x-auto pb-1">
          <TabsList className="bg-slate-100 dark:bg-slate-900 p-1 rounded-xl h-11 sm:h-12 inline-flex border border-grey-card-stroke w-auto min-w-full sm:min-w-0">
            <TabsTrigger
              value="expenses"
              className="rounded-lg font-bold text-xs sm:text-sm px-3 sm:px-5 data-[state=active]:bg-white dark:data-[state=active]:bg-card data-[state=active]:shadow-sm shrink-0 flex-1 sm:flex-none"
            >
              <FileSpreadsheet className="w-4 h-4 mr-1.5 sm:mr-2" />
              <Typography variant="button-semibold" className="text-xs sm:text-sm">
                <span className="sm:hidden">Expenses</span>
                <span className="hidden sm:inline">My Fuel Expenses</span>
              </Typography>
            </TabsTrigger>
            <TabsTrigger
              value="profile"
              className="rounded-lg font-bold text-xs sm:text-sm px-3 sm:px-5 data-[state=active]:bg-white dark:data-[state=active]:bg-card data-[state=active]:shadow-sm shrink-0 flex-1 sm:flex-none"
            >
              <User className="w-4 h-4 mr-1.5 sm:mr-2" />
              <Typography variant="button-semibold" className="text-xs sm:text-sm">
                <span className="sm:hidden">Profile</span>
                <span className="hidden sm:inline">My Profile</span>
              </Typography>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab 1: Fuel Expenses */}
        <TabsContent value="expenses" className="space-y-6 md:space-y-8">
          <StatsGrid items={clientStats} />

          <FuelExpenseFilter
            filters={draftFilters}
            onFiltersChange={setDraftFilters}
            onApply={handleApplyFilters}
            onClear={handleClearFilters}
            onExportExcel={handleExportExcel}
            isExporting={isExporting}
            hasAppliedFilters={filtersAreActive(appliedFilters)}
            vehicles={vehicles}
            variant="client"
          />

          {exportError && (
            <div className="p-3 text-xs sm:text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl">
              {exportError}
            </div>
          )}

          <GenericTable
            title="My Refuel Records"
            data={expenses}
            columns={clientColumns}
            isLoading={isLoading}
            loadingLabel="Loading your fuel expense history..."
            selection={{
              selectedIds: selectedExpenseIds,
              onToggle: toggleExpenseSelection,
              onToggleAll: toggleSelectAllExpenses,
              allSelected: allExpensesSelected,
              someSelected: someExpensesSelected,
            }}
            headerActions={
              selectedExpenseCount > 0 ? (
                <DeleteRecordButton
                  label={`Delete ${selectedExpenseCount} selected expenses`}
                  title={`Delete ${selectedExpenseCount} selected record${selectedExpenseCount === 1 ? "" : "s"}?`}
                  description={`This will permanently remove ${selectedExpenseCount} fuel submission${selectedExpenseCount === 1 ? "" : "s"}.`}
                  isDeleting={isBulkDeleting}
                  buttonText={`Delete Selected (${selectedExpenseCount})`}
                  onConfirm={handleBulkDeleteExpenses}
                />
              ) : null
            }
            mobileRender={(exp: AdminFuelExpense, mobile) => (
              <div
                className={`p-4 mx-3 sm:mx-4 my-3 sm:my-4 bg-white dark:bg-card border border-grey-card-stroke rounded-2xl shadow-sm space-y-3.5 ${
                  mobile?.isSelected ? "bg-blue-50/40 dark:bg-blue-950/20 border-blue-200" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  {mobile?.selectionCheckbox}
                  <div className="flex-1 min-w-0 space-y-3">
                    <div className="flex justify-between items-start gap-2">
                      <div className="space-y-0.5 min-w-0 flex-1">
                        <Typography
                          variant="body-semibold"
                          className="text-foreground font-bold text-sm sm:text-base truncate block"
                        >
                          {exp.vehicleName}
                        </Typography>
                        <div className="font-mono text-xs text-muted-foreground font-semibold">{exp.plateNumber}</div>
                      </div>
                      <Typography
                        variant="body-bold"
                        className="text-foreground text-base sm:text-lg font-black whitespace-nowrap"
                      >
                        {exp.totalAmountFormatted}
                      </Typography>
                    </div>

                    <div className="bg-slate-50/60 dark:bg-slate-900/40 p-3 rounded-xl border border-grey-card-stroke space-y-2 text-xs">
                      <div className="flex justify-between gap-2">
                        <span className="text-muted-foreground font-medium shrink-0">Fuel Volume:</span>
                        <span className="min-w-0 text-right break-words font-bold text-foreground">{exp.litersFormatted} (@ {exp.pricePerLiterFormatted}/L)</span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-muted-foreground font-medium shrink-0">Odometer:</span>
                        <span className="min-w-0 text-right break-words font-mono font-bold text-foreground">{exp.odometerFormatted}</span>
                      </div>
                      <div className="text-muted-foreground pt-1 border-t border-slate-200/60 dark:border-slate-800">
                        Date: <span className="text-foreground font-semibold">{exp.date}</span>
                      </div>
                      {exp.notes !== "—" && (
                        <div className="text-muted-foreground pt-1 border-t border-slate-200/60 dark:border-slate-800 break-words">
                          <span className="font-semibold text-foreground">Notes:</span> {exp.notes}
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end pt-1">
                      <DeleteRecordButton
                        label={`Delete expense on ${exp.date}`}
                        title="Delete fuel record?"
                        description="This will permanently remove this record."
                        isDeleting={deletingExpenseId === exp.id}
                        onConfirm={() => handleDeleteExpense(exp.id)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
            pagination={
              totalCount > 0 && (
                <div className="flex flex-row items-center justify-between sm:justify-center gap-2 sm:gap-6 w-full pt-2">
                  <Button
                    variant="outline"
                    className="rounded-xl font-bold h-10 px-3 sm:px-4 flex items-center justify-center gap-1 transition-all active:scale-[0.97] text-xs sm:text-sm"
                    disabled={isLoading || page === 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    <ChevronLeft className="w-4 h-4 shrink-0" />
                    <span className="hidden sm:inline">Previous</span>
                  </Button>

                  <span className="text-xs sm:text-sm text-muted-foreground font-bold bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 px-3 py-2 rounded-xl text-center shadow-none min-w-[90px] sm:min-w-auto">
                    {isLoading ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Loading...
                      </span>
                    ) : (
                      <>
                        Page {page} <span className="text-slate-300 font-normal mx-0.5">of</span> {totalPages}
                      </>
                    )}
                  </span>

                  <Button
                    variant="outline"
                    className="rounded-xl font-bold h-10 px-3 sm:px-4 flex items-center justify-center gap-1 transition-all active:scale-[0.97] text-xs sm:text-sm"
                    disabled={isLoading || page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight className="w-4 h-4 shrink-0" />
                  </Button>
                </div>
              )
            }
          />
        </TabsContent>

        {/* Tab 2: Profile */}
        <TabsContent value="profile" className="flex justify-center pt-2">
          <ProfileTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
