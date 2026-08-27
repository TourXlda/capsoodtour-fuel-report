import type { FuelExpenseWithVehicleRow } from "@/types";

export const FUEL_EXPORT_HEADERS = [
  "Date",
  "Vehicle",
  "Plate Number",
  "Driver Name",
  "Odometer Reading (km)",
  "Liters",
  "Price / Liter (EUR)",
  "Total Amount (EUR)",
  "Distance (km)",
  "Notes",
] as const;

export type FuelExportRow = [
  string,
  string,
  string,
  string,
  string | number,
  string | number,
  string | number,
  string | number,
  string | number,
  string,
];

function buildDistanceMap(expenses: FuelExpenseWithVehicleRow[]): Record<string, number> {
  const vehicleOdometerMap: Record<string, number> = {};
  const distancesMap: Record<string, number> = {};

  const sorted = [...expenses].sort(
    (a, b) => Number(a.odometer_reading || 0) - Number(b.odometer_reading || 0),
  );

  sorted.forEach((exp) => {
    const vId = exp.vehicle_id;
    const currentOdo = Number(exp.odometer_reading || 0);
    if (vehicleOdometerMap[vId] !== undefined) {
      const dist = currentOdo - vehicleOdometerMap[vId];
      if (dist > 0) {
        distancesMap[exp.id] = dist;
      }
    }
    vehicleOdometerMap[vId] = currentOdo;
  });

  return distancesMap;
}

export function buildFuelExportRows(
  expenses: FuelExpenseWithVehicleRow[],
): FuelExportRow[] {
  const distancesMap = buildDistanceMap(expenses);

  return expenses.map((expense) => {
    const distance = distancesMap[expense.id] || 0;
    return [
      expense.expense_date || "",
      expense.vehicles?.name || "Unknown Vehicle",
      expense.vehicles?.plate_number || "—",
      expense.driver_name || "",
      expense.odometer_reading ?? "",
      expense.liters ?? "",
      expense.price_per_liter ?? "",
      expense.total_amount ?? "",
      distance > 0 ? distance : "—",
      expense.notes || "",
    ] satisfies FuelExportRow;
  });
}
