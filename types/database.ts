export type VehicleStatus = "active" | "inactive" | "maintenance";

export type FuelType =
  | "petrol"
  | "diesel"
  | "cng"
  | "electric"
  | "hybrid"
  | "other";

export type AppUserRole = "admin" | "client";

export interface ProfileRow {
  id: string;
  email: string;
  role: AppUserRole;
  created_at: string;
  first_name?: string | null;
  last_name?: string | null;
}

export interface VehicleRow {
  id: string;
  name: string;
  plate_number: string;
  fuel_type: FuelType;
  status: VehicleStatus;
  created_at?: string;
  updated_at?: string;
}

export interface FuelExpenseRow {
  id: string;
  user_id: string;
  vehicle_id: string;
  expense_date: string;
  driver_name: string;
  odometer_reading: number;
  liters: number;
  price_per_liter: number;
  total_amount: number;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export type FuelExpenseWithVehicleRow = FuelExpenseRow & {
  vehicles?: {
    id?: string;
    name?: string;
    plate_number?: string;
    fuel_type?: FuelType | string;
    status?: VehicleStatus | string;
  } | null;
};
