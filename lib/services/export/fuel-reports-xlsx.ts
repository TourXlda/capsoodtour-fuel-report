import * as XLSX from "xlsx";
import type { FuelExpenseWithVehicleRow } from "@/types";
import { buildFuelExportRows, FUEL_EXPORT_HEADERS } from "./fuel-report-rows";

export function downloadFuelReportsExcel(
  expenses: FuelExpenseWithVehicleRow[],
  filenamePrefix = "capsood-fuel-reports",
) {
  const rows = buildFuelExportRows(expenses);
  const worksheet = XLSX.utils.aoa_to_sheet([Array.from(FUEL_EXPORT_HEADERS), ...rows]);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "Fuel Reports");

  const dateStamp = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `${filenamePrefix}-${dateStamp}.xlsx`);
}
