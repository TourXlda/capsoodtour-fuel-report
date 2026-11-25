import { supabase } from "@/lib/supabase/client";
import type {
  VehicleRow,
  FormattedVehicle,
  VehicleMutationResult,
  BulkVehicleDeleteResult,
} from "@/types";
import type { VehicleInput } from "@/lib/validations/fuel/vehicle";
import { formatFuelType, formatVehicleStatus } from "@/lib/utils";

export function formatVehicle(row: VehicleRow): FormattedVehicle {
  return {
    id: row.id,
    name: row.name,
    plateNumber: row.plate_number,
    fuelType: row.fuel_type,
    fuelTypeLabel: formatFuelType(row.fuel_type),
    status: row.status,
    statusLabel: formatVehicleStatus(row.status),
    createdAt: row.created_at
      ? new Date(row.created_at).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "N/A",
  };
}

export const PAGE_SIZE = 10;

/**
 * Fetch a page of vehicles (default page = 1, page size = 10).
 * Returns the formatted rows and the total row count for pagination UI.
 */
export async function fetchVehicles(page = 1) {
  const start = (page - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE - 1; // inclusive range

  const { data, error, count } = await supabase
    .from("vehicles")
    .select("*", { count: "exact" }) // get total rows for pagination
    .order("created_at", { ascending: false })
    .range(start, end);

  if (error) {
    return { data: null, error, total: 0 };
  }

  return {
    data: (data as VehicleRow[]).map(formatVehicle),
    error: null,
    total: count ?? 0,
  };
}

/** All vehicles (any status), for admin pickers such as the expense edit dialog. */
export async function fetchAllVehicles() {
  const { data, error } = await supabase
    .from("vehicles")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    return { data: null, error };
  }

  return { data: (data as VehicleRow[]).map(formatVehicle), error: null };
}

export async function fetchActiveVehicles() {
  const { data, error } = await supabase
    .from("vehicles")
    .select("*")
    .eq("status", "active")
    .order("name", { ascending: true });

  if (error) {
    return { data: null, error };
  }

  return { data: (data as VehicleRow[]).map(formatVehicle), error: null };
}

export async function createVehicle(
  input: VehicleInput,
): Promise<VehicleMutationResult> {
  const { data, error } = await supabase
    .from("vehicles")
    .insert([
      {
        name: input.name.trim(),
        plate_number: input.plateNumber.trim().toUpperCase(),
        fuel_type: input.fuelType,
        status: input.status,
      },
    ])
    .select()
    .single();

  if (error) {
    return { success: false, message: error.message };
  }

  return { success: true, data: data as VehicleRow };
}

export async function updateVehicle(
  id: string,
  input: Partial<VehicleInput>,
): Promise<VehicleMutationResult> {
  const updateData: Partial<VehicleRow> = {};
  if (input.name !== undefined) updateData.name = input.name.trim();
  if (input.plateNumber !== undefined)
    updateData.plate_number = input.plateNumber.trim().toUpperCase();
  if (input.fuelType !== undefined) updateData.fuel_type = input.fuelType;
  if (input.status !== undefined) updateData.status = input.status;

  const { data, error } = await supabase
    .from("vehicles")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { success: false, message: error.message };
  }

  return { success: true, data: data as VehicleRow };
}

export async function deleteVehicle(id: string): Promise<VehicleMutationResult> {
  const { error } = await supabase.from("vehicles").delete().eq("id", id);

  if (error) {
    return { success: false, message: error.message };
  }

  return { success: true };
}

export async function deleteVehicles(
  ids: string[],
): Promise<BulkVehicleDeleteResult> {
  if (ids.length === 0) {
    return { success: false, message: "No vehicles selected.", deletedCount: 0 };
  }

  const results = await Promise.all(ids.map((id) => deleteVehicle(id)));
  const deletedCount = results.filter((r) => r.success).length;
  const firstError = results.find((r) => !r.success)?.message;

  if (deletedCount === 0) {
    return {
      success: false,
      message: firstError || "No vehicles were deleted.",
      deletedCount: 0,
    };
  }

  if (deletedCount < ids.length) {
    return {
      success: false,
      message:
        firstError ||
        `Only ${deletedCount} of ${ids.length} vehicles were deleted.`,
      deletedCount,
    };
  }

  return { success: true, deletedCount };
}
