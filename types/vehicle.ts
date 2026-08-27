import type { FuelType, VehicleRow, VehicleStatus } from "@/types/database";

export interface FormattedVehicle {
  id: string;
  name: string;
  plateNumber: string;
  fuelType: FuelType;
  fuelTypeLabel: string;
  status: VehicleStatus;
  statusLabel: string;
  createdAt: string;
}

export interface VehicleFormValues {
  name: string;
  plateNumber: string;
  fuelType: FuelType;
  status: VehicleStatus;
}

export type VehicleMutationResult =
  | { success: true; data?: VehicleRow }
  | { success: false; message: string };

export type BulkVehicleDeleteResult =
  | { success: true; deletedCount: number }
  | { success: false; message: string; deletedCount: number };
