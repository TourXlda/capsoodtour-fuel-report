import { supabase } from "@/lib/supabase/client";
import type {
  RegisteredDriver,
  RegisteredClientRow,
  DriverDeleteResult,
  BulkDriverDeleteResult,
} from "@/types";

/** Registered drivers = client-role users (profiles), not a separate drivers table. */

export type {
  RegisteredDriver,
  RegisteredClientRow,
  DriverDeleteResult,
  BulkDriverDeleteResult,
};

function buildDriverDisplayName(
  email: string,
  firstName?: string | null,
  lastName?: string | null,
): string {
  const fullName = [firstName, lastName]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" ")
    .trim();

  if (fullName) return fullName;

  return email.split("@")[0] || email;
}

export function formatRegisteredDriver(profile: RegisteredClientRow): RegisteredDriver {
  const firstName = profile.first_name?.trim() || "";
  const lastName = profile.last_name?.trim() || "";

  return {
    id: profile.id,
    email: profile.email,
    firstName,
    lastName,
    displayName: buildDriverDisplayName(profile.email, firstName, lastName),
    joinedAt: new Date(profile.created_at).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
  };
}

export async function fetchRegisteredDrivers() {
  return supabase.rpc("get_registered_clients");
}

export async function deleteRegisteredDriver(
  userId: string,
): Promise<DriverDeleteResult> {
  const { error } = await supabase.rpc("admin_delete_client", {
    target_user_id: userId,
  });

  if (error) {
    return { success: false, message: error.message };
  }

  return { success: true };
}

export async function deleteRegisteredDrivers(
  userIds: string[],
): Promise<BulkDriverDeleteResult> {
  if (userIds.length === 0) {
    return { success: false, message: "No drivers selected.", deletedCount: 0 };
  }

  const results = await Promise.all(
    userIds.map((userId) => deleteRegisteredDriver(userId)),
  );

  const deletedCount = results.filter((result) => result.success).length;
  const firstError = results.find((result) => !result.success)?.message;

  if (deletedCount === 0) {
    return {
      success: false,
      message: firstError || "No drivers were deleted.",
      deletedCount: 0,
    };
  }

  if (deletedCount < userIds.length) {
    return {
      success: false,
      message:
        firstError ||
        `Only ${deletedCount} of ${userIds.length} drivers were deleted.`,
      deletedCount,
    };
  }

  return { success: true, deletedCount };
}
