"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DollarSign,
  Fuel,
  Gauge,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Car,
  Users,
  FileSpreadsheet,
} from "lucide-react";
import { useNavbar } from "@/components/layout/DashboardLayout";
import { NavbarProfileMenu } from "@/components/layout/NavbarProfileMenu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { StatsGrid } from "@/components/dashboard/StatsGrid";
import { GenericTable } from "@/components/dashboard/GenericTable";
import { FuelExpenseFilter } from "@/components/dashboard/FuelExpenseFilter";
import { CostByVehicleCard } from "@/components/dashboard/CostByVehicleCard";
import { DeleteRecordButton } from "@/components/dashboard/DeleteRecordButton";
import { EditFuelExpenseButton } from "@/components/fuel/EditFuelExpenseDialog";
import { VehicleManagement } from "@/components/vehicles/VehicleManagement";
import { Typography } from "@/components/ui/typography";
import { useRequireRole } from "@/hooks/use-require-role";
import type {
  FuelExpenseWithVehicleRow,
  FormattedVehicle,
  RegisteredDriver,
  AdminFuelExpense,
  FuelAnalyticsData,
  FuelReportFilters,
  ColumnConfig,
} from "@/types";
import { fetchAdminFuelExpensesPage, fetchAdminFuelAnalytics, fetchFuelExpensesForExport, formatAdminFuelExpense, EMPTY_FUEL_REPORT_FILTERS } from "@/lib/services/admin/fuel-filters";
import { fetchVehicles } from "@/lib/services/vehicles";
import { fetchRegisteredDrivers, deleteRegisteredDriver, deleteRegisteredDrivers, formatRegisteredDriver } from "@/lib/services/admin/drivers";
import { deleteFuelExpense, deleteFuelExpenses } from "@/lib/services/fuel/fuel-expenses";
import { downloadFuelReportsExcel } from "@/lib/services/export/fuel-reports-xlsx";
import { formatEuroAmount, formatLiters, formatConsumption } from "@/lib/utils";
import { toast } from "sonner";

function filtersAreActive(filters: FuelReportFilters): boolean {
  return Boolean(
    filters.dateFrom ||
      filters.dateTo ||
      (filters.vehicleId && filters.vehicleId !== "all") ||
      filters.driverName.trim(),
  );
}

export default function AdminDashboard() {
  const isAuthorized = useRequireRole("admin");
  const [activeTab, setActiveTab] = useState<"expenses" | "vehicles" | "drivers">("expenses");
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
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const [draftFilters, setDraftFilters] = useState<FuelReportFilters>(EMPTY_FUEL_REPORT_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<FuelReportFilters>(EMPTY_FUEL_REPORT_FILTERS);

  const [vehicles, setVehicles] = useState<FormattedVehicle[]>([]);
  const [isVehiclesLoading, setIsVehiclesLoading] = useState(true);

  const [drivers, setDrivers] = useState<RegisteredDriver[]>([]);
  const [isDriversLoading, setIsDriversLoading] = useState(true);

  const [deletingExpenseId, setDeletingExpenseId] = useState<string | null>(null);
  const [deletingDriverId, setDeletingDriverId] = useState<string | null>(null);
  const [selectedExpenseIds, setSelectedExpenseIds] = useState<Set<string>>(new Set());
  const [selectedDriverIds, setSelectedDriverIds] = useState<Set<string>>(new Set());
  const [isBulkDeletingExpenses, setIsBulkDeletingExpenses] = useState(false);
  const [isBulkDeletingDrivers, setIsBulkDeletingDrivers] = useState(false);

  const pageSize = 10;
  const { setNavbarConfig } = useNavbar();

  const loadVehicles = useCallback(async () => {
    try {
      setIsVehiclesLoading(true);
      const { data, error } = await fetchVehicles();
      if (!error && data) {
        setVehicles(data);
      }
    } catch (err) {
      console.error("Failed to load vehicles:", err);
    } finally {
      setIsVehiclesLoading(false);
    }
  }, []);

  const fetchExpensesAndAnalytics = useCallback(
    async (currentPage: number, filters: FuelReportFilters) => {
      try {
        setIsLoading(true);

        const [pageRes, analyticsRes] = await Promise.all([
          fetchAdminFuelExpensesPage(currentPage, pageSize, filters),
          fetchAdminFuelAnalytics(filters),
        ]);

        if (pageRes.error) {
          console.error("Error fetching fuel expenses:", pageRes.error.message);
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
        console.error("Unexpected dashboard error:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [pageSize],
  );

  const loadDrivers = useCallback(async () => {
    try {
      setIsDriversLoading(true);
      const { data, error } = await fetchRegisteredDrivers();
      if (error) {
        console.error("Error fetching drivers:", error.message);
        return;
      }
      setDrivers((data ?? []).map(formatRegisteredDriver));
      setSelectedDriverIds(new Set());
    } catch (err) {
      console.error("Unexpected drivers fetch error:", err);
    } finally {
      setIsDriversLoading(false);
    }
  }, []);

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
      void loadDrivers();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [isAuthorized, loadDrivers]);

  useEffect(() => {
    if (!isAuthorized || activeTab !== "expenses") return;
    const timer = window.setTimeout(() => {
      void fetchExpensesAndAnalytics(page, appliedFilters);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [isAuthorized, page, appliedFilters, activeTab, fetchExpensesAndAnalytics]);

  useEffect(() => {
  const timer = setTimeout(() => {
    setNavbarConfig({
      title: "Admin Fuel Dashboard",
      subtitle: "Monitor fleet fuel costs, vehicle consumption, and driver refuel records",
      rightAction: <NavbarProfileMenu role="admin" />,
    });
  }, 0);

  return () => clearTimeout(timer);
}, [setNavbarConfig])

const handleDeleteExpense = async (id: string) => {
  try {
    setDeletingExpenseId(id);
    const result = await deleteFuelExpense(id);

    if (!result.success) {
      toast.error("Failed to delete fuel expense", { description: result.message });
      return;
    }

    toast.success("Fuel expense deleted successfully");
    
  
    setExpenses((prev) => prev.filter((item) => item.id !== id));
    setSelectedExpenseIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });

    
    if (expenses.length === 1 && page > 1) {
      setPage((p) => p - 1);
    } else {
      await fetchExpensesAndAnalytics(page, appliedFilters);
    }
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
      setIsBulkDeletingExpenses(true);
      const result = await deleteFuelExpenses(ids);

      if (!result.success) {
        toast.error("Failed to delete selected expenses", { description: result.message });
        return;
      }

      toast.success(`${result.deletedCount} expense(s) deleted successfully`);
      setSelectedExpenseIds(new Set());
      await fetchExpensesAndAnalytics(page, appliedFilters);
    } catch (err) {
      console.error("Bulk delete error:", err);
      toast.error("Failed to delete selected expenses");
    } finally {
      setIsBulkDeletingExpenses(false);
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

  const handleDeleteDriver = async (driverId: string) => {
    try {
      setDeletingDriverId(driverId);
      const result = await deleteRegisteredDriver(driverId);

      if (!result.success) {
        toast.error("Failed to delete driver", { description: result.message });
        return;
      }

      toast.success("Driver deleted successfully");
      setSelectedDriverIds((prev) => {
        const next = new Set(prev);
        next.delete(driverId);
        return next;
      });

      await Promise.all([loadDrivers(), fetchExpensesAndAnalytics(page, appliedFilters)]);
    } catch (err) {
      console.error("Delete driver error:", err);
      toast.error("Failed to delete driver");
    } finally {
      setDeletingDriverId(null);
    }
  };

  const handleBulkDeleteDrivers = async () => {
    const ids = Array.from(selectedDriverIds);
    if (ids.length === 0) return;

    try {
      setIsBulkDeletingDrivers(true);
      const result = await deleteRegisteredDrivers(ids);

      if (!result.success && result.deletedCount === 0) {
        toast.error("Failed to delete selected drivers", { description: result.message });
        return;
      }

      toast.success(`${result.deletedCount} driver(s) deleted successfully`);
      setSelectedDriverIds(new Set());
      await Promise.all([loadDrivers(), fetchExpensesAndAnalytics(page, appliedFilters)]);
    } catch (err) {
      console.error("Bulk driver delete error:", err);
      toast.error("Failed to delete selected drivers");
    } finally {
      setIsBulkDeletingDrivers(false);
    }
  };

  const toggleDriverSelection = (driverId: string, checked: boolean) => {
    setSelectedDriverIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(driverId);
      else next.delete(driverId);
      return next;
    });
  };

  const toggleSelectAllDrivers = (checked: boolean) => {
    if (checked) {
      setSelectedDriverIds(new Set(drivers.map((d) => d.id)));
    } else {
      setSelectedDriverIds(new Set());
    }
  };

  const handleApplyFilters = () => {
  setExportError("");
  setSelectedExpenseIds(new Set());
  setAppliedFilters({ ...draftFilters });
  setPage(1);
};

const handleClearFilters = () => {
  setExportError("");
  setSelectedExpenseIds(new Set());
  setDraftFilters(EMPTY_FUEL_REPORT_FILTERS);
  setAppliedFilters(EMPTY_FUEL_REPORT_FILTERS);
  setPage(1);
};

  const handleExportExcel = async () => {
    try {
      setExportError("");
      setIsExporting(true);

      const { data, error } = await fetchFuelExpensesForExport(appliedFilters);

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

      downloadFuelReportsExcel(rows, "admin-fuel-reports");
      toast.success("Excel file downloaded successfully");
    } catch (err) {
      console.error("Export failed:", err);
      setExportError("Failed to export fuel reports. Please try again.");
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

  const allDriversSelected =
    drivers.length > 0 && drivers.every((d) => selectedDriverIds.has(d.id));
  const someDriversSelected =
    drivers.some((d) => selectedDriverIds.has(d.id)) && !allDriversSelected;
  const selectedDriverCount = selectedDriverIds.size;

  const adminStats = [
    {
      label: "Monthly Fuel Cost",
      value: formatEuroAmount(analytics.totalFuelCost),
      icon: DollarSign,
      iconColorClass: "text-emerald-600",
      bgColorClass: "bg-emerald-50/70 border-emerald-100",
    },
    {
      label: "Total Fuel Volume",
      value: formatLiters(analytics.totalLiters),
      icon: Fuel,
      iconColorClass: "text-blue-600",
      bgColorClass: "bg-blue-50/70 border-blue-100",
    },
    {
      label: "Avg Fuel Consumption",
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

  const expenseColumns: ColumnConfig<AdminFuelExpense>[] = [
    {
      header: "Date",
      accessorKey: "date",
      renderCell: (e) => (
        <span className="font-bold text-xs xl:text-sm text-foreground">{e.date}</span>
      ),
    },
    {
      header: "Driver",
      accessorKey: "driver",
      renderCell: (e) => (
        <span className="font-semibold text-xs xl:text-sm text-foreground">{e.driver}</span>
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
        <div className="flex items-center justify-center gap-1">
          <EditFuelExpenseButton
            expense={e}
            onSaved={() => void fetchExpensesAndAnalytics(page, appliedFilters)}
          />
          <DeleteRecordButton
            label={`Delete expense on ${e.date}`}
            title="Delete fuel expense record?"
            description="This will permanently remove this fuel refill submission. This action cannot be undone."
            isDeleting={deletingExpenseId === e.id}
            onConfirm={() => handleDeleteExpense(e.id)}
          />
        </div>
      ),
    },
  ];

  const driverColumns: ColumnConfig<RegisteredDriver>[] = [
    {
      header: "Driver Name",
      accessorKey: "displayName",
      renderCell: (d) => (
        <span className="font-bold text-xs xl:text-sm text-foreground">{d.displayName}</span>
      ),
    },
    {
      header: "Email",
      accessorKey: "email",
      renderCell: (d) => (
        <span className="font-medium text-xs xl:text-sm text-muted-foreground break-all">{d.email}</span>
      ),
    },
    {
      header: "Registered",
      accessorKey: "joinedAt",
      renderCell: (d) => (
        <Typography variant="muted-sm" className="text-muted-foreground text-xs xl:text-sm">
          {d.joinedAt}
        </Typography>
      ),
    },
    {
      header: "Actions",
      accessorKey: "id",
      renderCell: (d) => (
        <DeleteRecordButton
          label={`Delete driver ${d.displayName}`}
          title="Delete registered driver?"
          description={`This will permanently remove ${d.displayName} (${d.email}) and their fuel records. This action cannot be undone.`}
          isDeleting={deletingDriverId === d.id}
          onConfirm={() => handleDeleteDriver(d.id)}
        />
      ),
    },
  ];

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="px-3 sm:px-6 md:px-8 2xl:px-12 py-4 sm:py-6 md:py-8 space-y-6 md:space-y-8 w-full mx-auto overflow-x-hidden">
      {/* Navigation Tabs for Admin Sections */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as "expenses" | "vehicles" | "drivers")}
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
                <span className="sm:hidden">Fuel</span>
                <span className="hidden sm:inline">Fuel Reports & Analytics</span>
              </Typography>
            </TabsTrigger>
            <TabsTrigger
              value="vehicles"
              className="rounded-lg font-bold text-xs sm:text-sm px-3 sm:px-5 data-[state=active]:bg-white dark:data-[state=active]:bg-card data-[state=active]:shadow-sm shrink-0 flex-1 sm:flex-none"
            >
              <Car className="w-4 h-4 mr-1.5 sm:mr-2" />
              <Typography variant="button-semibold" className="text-xs sm:text-sm">
                <span className="sm:hidden">Vehicles</span>
                <span className="hidden sm:inline">Vehicle Database</span>
              </Typography>
            </TabsTrigger>
            <TabsTrigger
              value="drivers"
              className="rounded-lg font-bold text-xs sm:text-sm px-3 sm:px-5 data-[state=active]:bg-white dark:data-[state=active]:bg-card data-[state=active]:shadow-sm shrink-0 flex-1 sm:flex-none"
            >
              <Users className="w-4 h-4 mr-1.5 sm:mr-2" />
              <Typography variant="button-semibold" className="text-xs sm:text-sm">
                <span className="sm:hidden">Drivers</span>
                <span className="hidden sm:inline">Registered Drivers</span>
              </Typography>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab 1: Fuel Reports & Analytics */}
        <TabsContent value="expenses" className="space-y-6 md:space-y-8">
          <StatsGrid items={adminStats} />

          <CostByVehicleCard
            data={analytics.costByVehicle}
            totalFuelCost={analytics.totalFuelCost}
          />

          <FuelExpenseFilter
            filters={draftFilters}
            onFiltersChange={setDraftFilters}
            onApply={handleApplyFilters}
            onClear={handleClearFilters}
            onExportExcel={handleExportExcel}
            isExporting={isExporting}
            hasAppliedFilters={filtersAreActive(appliedFilters)}
            vehicles={vehicles}
            variant="admin"
          />

          {exportError && (
            <div className="p-3 text-xs sm:text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl">
              {exportError}
            </div>
          )}

          <GenericTable
            title="Incoming Fuel Expense Submissions"
            data={expenses}
            columns={expenseColumns}
            isLoading={isLoading}
            loadingLabel="Loading fuel expense reports..."
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
                  title={`Delete ${selectedExpenseCount} selected fuel expense${selectedExpenseCount === 1 ? "" : "s"}?`}
                  description={`This will permanently remove ${selectedExpenseCount} fuel submission${selectedExpenseCount === 1 ? "" : "s"}.`}
                  isDeleting={isBulkDeletingExpenses}
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
                          {exp.driver}
                        </Typography>
                        <div className="text-xs text-muted-foreground truncate">
                          {exp.vehicleName} • <span className="font-mono font-bold text-foreground">{exp.plateNumber}</span>
                        </div>
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

                    <div className="flex justify-end gap-1 pt-1">
                      <EditFuelExpenseButton
                        expense={exp}
                        onSaved={() => void fetchExpensesAndAnalytics(page, appliedFilters)}
                      />
                      <DeleteRecordButton
                        label={`Delete expense on ${exp.date}`}
                        title="Delete fuel expense record?"
                        description="This will permanently remove this fuel submission."
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

        {/* Tab 2: Vehicle Database */}
        <TabsContent value="vehicles">
          <VehicleManagement
            vehicles={vehicles}
            isLoading={isVehiclesLoading}
            onRefresh={loadVehicles}
          />
        </TabsContent>

        {/* Tab 3: Registered Drivers */}
        <TabsContent value="drivers">
          <GenericTable
            title="Registered Drivers"
            data={drivers}
            columns={driverColumns}
            isLoading={isDriversLoading}
            loadingLabel="Loading registered drivers..."
            selection={{
              selectedIds: selectedDriverIds,
              onToggle: toggleDriverSelection,
              onToggleAll: toggleSelectAllDrivers,
              allSelected: allDriversSelected,
              someSelected: someDriversSelected,
            }}
            headerActions={
              selectedDriverCount > 0 ? (
                <DeleteRecordButton
                  label={`Delete ${selectedDriverCount} selected drivers`}
                  title={`Delete ${selectedDriverCount} selected driver${selectedDriverCount === 1 ? "" : "s"}?`}
                  description={`This will permanently remove ${selectedDriverCount} driver account${selectedDriverCount === 1 ? "" : "s"} and all associated fuel records.`}
                  isDeleting={isBulkDeletingDrivers}
                  buttonText={`Delete Selected (${selectedDriverCount})`}
                  onConfirm={handleBulkDeleteDrivers}
                />
              ) : null
            }
            mobileRender={(driver: RegisteredDriver, mobile) => (
              <div
                className={`p-4 mx-3 sm:mx-4 my-3 sm:my-4 bg-white dark:bg-card border border-grey-card-stroke rounded-2xl shadow-sm ${
                  mobile?.isSelected ? "bg-blue-50/40 dark:bg-blue-950/20 border-blue-200" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  {mobile?.selectionCheckbox}
                  <div className="flex-1 min-w-0 space-y-2.5">
                    <div className="space-y-0.5">
                      <Typography
                        variant="body-semibold"
                        className="text-foreground font-bold text-sm sm:text-base"
                      >
                        {driver.displayName}
                      </Typography>
                      <div className="text-xs text-muted-foreground break-all">{driver.email}</div>
                      <div className="text-xs text-muted-foreground">Registered {driver.joinedAt}</div>
                    </div>
                    <div className="flex justify-end pt-1">
                      <DeleteRecordButton
                        label={`Delete driver ${driver.displayName}`}
                        title="Delete registered driver?"
                        description={`This will permanently remove ${driver.displayName} (${driver.email}).`}
                        isDeleting={deletingDriverId === driver.id}
                        onConfirm={() => handleDeleteDriver(driver.id)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
