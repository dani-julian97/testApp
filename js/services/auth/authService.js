import { getSupabase, isCloudEnabled } from "../../lib/supabase/client.js";
import { getAuthRedirectUrl } from "../../config/env.js";
import { toAuthError, validateEmail, validatePassword } from "./errors.js";

/**
 * @param {string} email
 * @param {string} password
 * @param {import("../../lib/supabase/types.js").UserProfileInput} [profile]
 */
export async function signUp(email, password, profile = {}) {
  if (!isCloudEnabled()) throw Object.assign(new Error("Cloud not configured"), { code: "not_configured" });
  if (!validateEmail(email)) throw Object.assign(new Error("Invalid email"), { code: "invalid_email" });
  if (!validatePassword(password)) {
    throw Object.assign(new Error("Weak password"), { code: "weak_password" });
  }

  const supabase = getSupabase();
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: {
      emailRedirectTo: getAuthRedirectUrl(""),
      data: {
        display_name: profile.display_name || email.split("@")[0],
        locale: profile.locale || navigator.language || "en",
        timezone: profile.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
      }
    }
  });

  if (error) throw Object.assign(new Error(toAuthError(error).message), toAuthError(error));
  return data;
}

export async function signIn(email, password) {
  if (!isCloudEnabled()) throw Object.assign(new Error("Cloud not configured"), { code: "not_configured" });
  if (!validateEmail(email)) throw Object.assign(new Error("Invalid email"), { code: "invalid_email" });

  const supabase = getSupabase();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password
  });

  if (error) throw Object.assign(new Error(toAuthError(error).message), toAuthError(error));
  return data;
}

export async function signOut() {
  const supabase = getSupabase();
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw Object.assign(new Error(toAuthError(error).message), toAuthError(error));
}

export async function resetPassword(email) {
  if (!isCloudEnabled()) throw Object.assign(new Error("Cloud not configured"), { code: "not_configured" });
  if (!validateEmail(email)) throw Object.assign(new Error("Invalid email"), { code: "invalid_email" });

  const supabase = getSupabase();
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: getAuthRedirectUrl("#recovery")
  });
  if (error) throw Object.assign(new Error(toAuthError(error).message), toAuthError(error));
}

export async function updatePassword(newPassword) {
  if (!validatePassword(newPassword)) {
    throw Object.assign(new Error("Weak password"), { code: "weak_password" });
  }
  const supabase = getSupabase();
  if (!supabase) throw Object.assign(new Error("Cloud not configured"), { code: "not_configured" });
  const { data, error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw Object.assign(new Error(toAuthError(error).message), toAuthError(error));
  return data;
}

export async function resendVerification(email) {
  if (!isCloudEnabled()) throw Object.assign(new Error("Cloud not configured"), { code: "not_configured" });
  const supabase = getSupabase();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email: email.trim(),
    options: { emailRedirectTo: getAuthRedirectUrl("") }
  });
  if (error) throw Object.assign(new Error(toAuthError(error).message), toAuthError(error));
}

export async function getSession() {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getSession();
  if (error) return null;
  return data.session;
}

export async function getUser() {
  const session = await getSession();
  return session?.user ?? null;
}

/**
 * Convert guest → registered without wiping local progress.
 * Creates account then caller pushes local state.
 */
export async function convertGuestToAccount(email, password, profile = {}) {
  return signUp(email, password, profile);
}

/**
 * Delete account via Edge Function (service role stays server-side).
 */
export async function deleteAccount() {
  const supabase = getSupabase();
  if (!supabase) throw Object.assign(new Error("Cloud not configured"), { code: "not_configured" });

  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw Object.assign(new Error("Not signed in"), { code: "session_expired" });

  const { data, error } = await supabase.functions.invoke("delete-account", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` }
  });

  if (error) throw Object.assign(new Error(toAuthError(error).message), toAuthError(error));
  await signOut();
  return data;
}

export function onAuthStateChange(callback) {
  const supabase = getSupabase();
  if (!supabase) return () => {};
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
  return () => data.subscription.unsubscribe();
}
