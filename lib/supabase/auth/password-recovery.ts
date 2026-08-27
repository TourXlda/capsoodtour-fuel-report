import { supabase } from "@/lib/supabase/client";
import { getPasswordResetRedirectUrl } from "@/lib/supabase/auth/recovery-storage";

export async function requestPasswordRecovery(email: string) {
  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo: getPasswordResetRedirectUrl(),
  });
}

export async function updatePassword(password: string) {
  return supabase.auth.updateUser({ password });
}

export async function signOutUser() {
  return supabase.auth.signOut();
}

export async function getActiveSession() {
  return supabase.auth.getSession();
}

export function subscribeToAuthChanges(
  callback: Parameters<typeof supabase.auth.onAuthStateChange>[0],
) {
  return supabase.auth.onAuthStateChange(callback);
}

export function hasRecoveryHashInUrl(): boolean {
  if (typeof window === "undefined") return false;

  const hash = window.location.hash;
  return hash.includes("access_token") || hash.includes("type=recovery");
}
