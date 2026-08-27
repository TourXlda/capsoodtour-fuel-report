import { supabase } from "@/lib/supabase/client";

export function normalizeAuthEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Returns null when the check could not be completed (do not treat as "not found"). */
export async function checkUserEmailExists(
  email: string,
): Promise<boolean | null> {
  const { data, error } = await supabase.rpc("check_user_email_exists", {
    check_email: normalizeAuthEmail(email),
  });

  if (error) {
    console.error("check_user_email_exists failed:", error.message);
    return null;
  }

  return Boolean(data);
}
