import { supabase } from "@/lib/supabase/client";
import type {
  FuelExpenseWithVehicleRow,
  FuelReportFilters,
  AdminFuelExpense,
  VehicleCostBreakdown,
  FuelAnalyticsData,
} from "@/types";
import {
  formatEuroAmount,
  formatLiters,
  formatKm,
  roundToTwoDecimals,
} from "@/lib/utils";

export type {
  FuelReportFilters,
  AdminFuelExpense,
  VehicleCostBreakdown,
  FuelAnalyticsData,
};

export const EMPTY_FUEL_REPORT_FILTERS: FuelReportFilters = {
  dateFrom: "",
  dateTo: "",
  vehicleId: "",
  driverName: "",
};

export function formatAdminFuelExpense(
  row: FuelExpenseWithVehicleRow,
  calculatedDistance: number = 0,
): AdminFuelExpense {
  const vehicle = row.vehicles;
  const vehicleName = vehicle?.name || "Unknown Vehicle";
  const plateNumber = vehicle?.plate_number || "—";
  const liters = Number(row.liters || 0);
  const pricePerLiter = Number(row.price_per_liter || 0);
  const totalAmount = Number(row.total_amount || 0);
  const odometer = Number(row.odometer_reading || 0);

  return {
    id: row.id,
    date: row.expense_date || "N/A",
    vehicleId: row.vehicle_id,
    vehicleName,
    plateNumber,
    driver: row.driver_name || "Unknown Driver",
    odometer,
    odometerFormatted: `${odometer.toLocaleString("en-IE")} km`,
    liters,
    litersFormatted: formatLiters(liters),
    pricePerLiter,
    pricePerLiterFormatted: formatEuroAmount(pricePerLiter),
    totalAmount,
    totalAmountFormatted: formatEuroAmount(totalAmount),
    distanceKm: calculatedDistance,
    distanceFormatted: calculatedDistance > 0 ? formatKm(calculatedDistance) : "—",
    notes: row.notes?.trim() || "—",
  };
}

export async function fetchAdminFuelExpensesPage(
  page: number,
  pageSize: number,
  filters: FuelReportFilters,
) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("fuel_expenses")
    .select("*, vehicles(id, name, plate_number, fuel_type)", { count: "exact" });

  if (filters.dateFrom) {
    query = query.gte("expense_date", filters.dateFrom);
  }

  if (filters.dateTo) {
    query = query.lte("expense_date", filters.dateTo);
  }

  if (filters.vehicleId && filters.vehicleId !== "all") {
    query = query.eq("vehicle_id", filters.vehicleId);
  }

  if (filters.driverName.trim()) {
    query = query.ilike("driver_name", `%${filters.driverName.trim()}%`);
  }

  return query
    .order("expense_date", { ascending: false })
    .order("created_at", { ascending: false })
    .range(from, to);
}

export async function fetchClientFuelExpensesPage(
  userId: string,
  page: number,
  pageSize: number,
  filters: FuelReportFilters,
) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("fuel_expenses")
    .select("*, vehicles(id, name, plate_number, fuel_type)", { count: "exact" })
    .eq("user_id", userId);

  if (filters.dateFrom) {
    query = query.gte("expense_date", filters.dateFrom);
  }

  if (filters.dateTo) {
    query = query.lte("expense_date", filters.dateTo);
  }

  if (filters.vehicleId && filters.vehicleId !== "all") {
    query = query.eq("vehicle_id", filters.vehicleId);
  }

  return query
    .order("expense_date", { ascending: false })
    .order("created_at", { ascending: false })
    .range(from, to);
}

function calculateAnalyticsFromRows(
  rows: FuelExpenseWithVehicleRow[],
): FuelAnalyticsData {
  let totalFuelCost = 0;
  let totalLiters = 0;

  const vehicleStatsMap: Record<
    string,
    {
      vehicleId: string;
      vehicleName: string;
      plateNumber: string;
      totalCost: number;
      totalLiters: number;
      entryCount: number;
      minOdometer: number;
      maxOdometer: number;
    }
  > = {};

  rows.forEach((row) => {
    const cost = Number(row.total_amount || 0);
    const liters = Number(row.liters || 0);
    const odo = Number(row.odometer_reading || 0);

    totalFuelCost += cost;
    totalLiters += liters;

    const vId = row.vehicle_id;
    const vName = row.vehicles?.name || "Unknown Vehicle";
    const vPlate = row.vehicles?.plate_number || "—";

    if (!vehicleStatsMap[vId]) {
      vehicleStatsMap[vId] = {
        vehicleId: vId,
        vehicleName: vName,
        plateNumber: vPlate,
        totalCost: 0,
        totalLiters: 0,
        entryCount: 0,
        minOdometer: odo,
        maxOdometer: odo,
      };
    }

    vehicleStatsMap[vId].totalCost += cost;
    vehicleStatsMap[vId].totalLiters += liters;
    vehicleStatsMap[vId].entryCount += 1;
    vehicleStatsMap[vId].minOdometer = Math.min(vehicleStatsMap[vId].minOdometer, odo);
    vehicleStatsMap[vId].maxOdometer = Math.max(vehicleStatsMap[vId].maxOdometer, odo);
  });

  let totalDistance = 0;
  Object.values(vehicleStatsMap).forEach((stat) => {
    const dist = stat.maxOdometer - stat.minOdometer;
    if (dist > 0) totalDistance += dist;
  });

  const costByVehicle: VehicleCostBreakdown[] = Object.values(vehicleStatsMap)
    .map((stat) => ({
      vehicleId: stat.vehicleId,
      vehicleName: stat.vehicleName,
      plateNumber: stat.plateNumber,
      totalCost: roundToTwoDecimals(stat.totalCost),
      totalLiters: roundToTwoDecimals(stat.totalLiters),
      entryCount: stat.entryCount,
      percentage: totalFuelCost > 0 ? Math.round((stat.totalCost / totalFuelCost) * 100) : 0,
    }))
    .sort((a, b) => b.totalCost - a.totalCost);

  const avgConsumption = totalDistance > 0 ? roundToTwoDecimals((totalLiters / totalDistance) * 100) : 0;
  const costPerKm = totalDistance > 0 ? roundToTwoDecimals(totalFuelCost / totalDistance) : 0;

  return {
    totalFuelCost: roundToTwoDecimals(totalFuelCost),
    totalLiters: roundToTwoDecimals(totalLiters),
    totalDistance: roundToTwoDecimals(totalDistance),
    avgConsumption,
    costPerKm,
    costByVehicle,
    entryCount: rows.length,
  };
}

export async function fetchAdminFuelAnalytics(
  filters: FuelReportFilters,
): Promise<{ data: FuelAnalyticsData | null; error: unknown }> {
  let query = supabase
    .from("fuel_expenses")
    .select("*, vehicles(id, name, plate_number, fuel_type)");

  if (filters.dateFrom) {
    query = query.gte("expense_date", filters.dateFrom);
  }
  if (filters.dateTo) {
    query = query.lte("expense_date", filters.dateTo);
  }
  if (filters.vehicleId && filters.vehicleId !== "all") {
    query = query.eq("vehicle_id", filters.vehicleId);
  }
  if (filters.driverName.trim()) {
    query = query.ilike("driver_name", `%${filters.driverName.trim()}%`);
  }

  const { data, error } = await query;
  if (error) return { data: null, error };

  const analytics = calculateAnalyticsFromRows((data as FuelExpenseWithVehicleRow[]) || []);
  return { data: analytics, error: null };
}

export async function fetchClientFuelAnalytics(
  userId: string,
  filters: FuelReportFilters,
): Promise<{ data: FuelAnalyticsData | null; error: unknown }> {
  let query = supabase
    .from("fuel_expenses")
    .select("*, vehicles(id, name, plate_number, fuel_type)")
    .eq("user_id", userId);

  if (filters.dateFrom) {
    query = query.gte("expense_date", filters.dateFrom);
  }
  if (filters.dateTo) {
    query = query.lte("expense_date", filters.dateTo);
  }
  if (filters.vehicleId && filters.vehicleId !== "all") {
    query = query.eq("vehicle_id", filters.vehicleId);
  }

  const { data, error } = await query;
  if (error) return { data: null, error };

  const analytics = calculateAnalyticsFromRows((data as FuelExpenseWithVehicleRow[]) || []);
  return { data: analytics, error: null };
}

export async function fetchFuelExpensesForExport(
  filters: FuelReportFilters,
  userId?: string,
) {
  let query = supabase
    .from("fuel_expenses")
    .select("*, vehicles(id, name, plate_number, fuel_type)");

  if (userId) {
    query = query.eq("user_id", userId);
  }
  if (filters.dateFrom) {
    query = query.gte("expense_date", filters.dateFrom);
  }
  if (filters.dateTo) {
    query = query.lte("expense_date", filters.dateTo);
  }
  if (filters.vehicleId && filters.vehicleId !== "all") {
    query = query.eq("vehicle_id", filters.vehicleId);
  }
  if (filters.driverName.trim()) {
    query = query.ilike("driver_name", `%${filters.driverName.trim()}%`);
  }

  return query.order("expense_date", { ascending: false });
}
