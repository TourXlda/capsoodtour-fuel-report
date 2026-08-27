
export interface FuelExpenseFormValues {
  expenseDate: string;
  vehicleId: string;
  driverName: string;
  odometerReading: string;
  liters: string;
  pricePerLiter: string;
  totalAmount: string;
  notes?: string;
}

export interface FuelReportFilters {
  dateFrom: string;
  dateTo: string;
  vehicleId: string;
  driverName: string;
}

export interface AdminFuelExpense {
  id: string;
  date: string;
  vehicleId: string;
  vehicleName: string;
  plateNumber: string;
  driver: string;
  odometer: number;
  odometerFormatted: string;
  liters: number;
  litersFormatted: string;
  pricePerLiter: number;
  pricePerLiterFormatted: string;
  totalAmount: number;
  totalAmountFormatted: string;
  distanceKm: number;
  distanceFormatted: string;
  notes: string;
}

export interface VehicleCostBreakdown {
  vehicleId: string;
  vehicleName: string;
  plateNumber: string;
  totalCost: number;
  totalLiters: number;
  entryCount: number;
  percentage: number;
}

export interface FuelAnalyticsData {
  totalFuelCost: number;
  totalLiters: number;
  totalDistance: number;
  avgConsumption: number; // L / 100km
  costPerKm: number; // € / km
  costByVehicle: VehicleCostBreakdown[];
  entryCount: number;
}

export type FuelExpenseDeleteResult =
  | { success: true }
  | { success: false; message: string };

export type BulkFuelExpenseDeleteResult =
  | { success: true; deletedCount: number }
  | { success: false; message: string; deletedCount: number };

/** Fields included in Excel exports */
export type FuelExportColumn =
  | "expense_date"
  | "vehicle_name"
  | "plate_number"
  | "driver_name"
  | "odometer_reading"
  | "liters"
  | "price_per_liter"
  | "total_amount"
  | "distance_km"
  | "notes";
