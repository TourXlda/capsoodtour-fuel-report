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
