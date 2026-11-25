import { supabase } from "@/lib/supabase/client";
import type {
  FuelExpenseDeleteResult,
  BulkFuelExpenseDeleteResult,
} from "@/types";

export async function deleteFuelExpense(
  id: string,
): Promise<FuelExpenseDeleteResult> {
  const { error } = await supabase
    .from("fuel_expenses")
    .delete()
    .eq("id", id);

  if (error) {
    return { success: false, message: error.message };
  }

  return { success: true };
}

export interface FuelExpenseUpdate {
  expense_date: string;
  vehicle_id: string;
  driver_name: string;
  odometer_reading: number;
  liters: number;
  price_per_liter: number;
  total_amount: number;
  notes: string | null;
}

/**
 * Admin edit of an existing fuel expense. Only the listed fields change;
 * the owner (user_id) and created_at are never touched.
 * Returns an error when no row was updated (e.g. missing permission).
 */
export async function updateFuelExpense(
  id: string,
  values: FuelExpenseUpdate,
): Promise<FuelExpenseDeleteResult> {
  const { data, error } = await supabase
    .from("fuel_expenses")
    .update(values)
    .eq("id", id)
    .select("id");

  if (error) {
    return { success: false, message: error.message };
  }

  if (!data || data.length === 0) {
    return {
      success: false,
      message: "The record was not updated. It may have been deleted, or you do not have permission to edit it.",
    };
  }

  return { success: true };
}

export async function deleteFuelExpenses(
  ids: string[],
): Promise<BulkFuelExpenseDeleteResult> {
  if (ids.length === 0) {
    return { success: false, message: "No expenses selected.", deletedCount: 0 };
  }

  const results = await Promise.all(
    ids.map((id) => deleteFuelExpense(id)),
  );

  const deletedCount = results.filter((r) => r.success).length;
  const firstError = results.find((r) => !r.success)?.message;

  if (deletedCount === 0) {
    return {
      success: false,
      message: firstError || "No fuel expenses were deleted.",
      deletedCount: 0,
    };
  }

  if (deletedCount < ids.length) {
    return {
      success: false,
      message:
        firstError ||
        `Only ${deletedCount} of ${ids.length} expenses were deleted.`,
      deletedCount,
    };
  }

  return { success: true, deletedCount };
}
