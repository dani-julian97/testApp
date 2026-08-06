import { getSupabase, isCloudEnabled } from "../../lib/supabase/client.js";
import { toAuthError } from "../auth/errors.js";

export async function getProfile() {
  const supabase = getSupabase();
  if (!supabase) return null;
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error) throw Object.assign(new Error(toAuthError(error).message), toAuthError(error));
  return data;
}

export async function updateProfile(patch) {
  const supabase = getSupabase();
  if (!supabase) throw Object.assign(new Error("Cloud not configured"), { code: "not_configured" });
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) throw Object.assign(new Error("Not signed in"), { code: "session_expired" });

  const payload = {
    ...patch,
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from("profiles")
    .upsert({ id: user.id, email: user.email, ...payload })
    .select()
    .single();

  if (error) throw Object.assign(new Error(toAuthError(error).message), toAuthError(error));
  return data;
}

export async function ensurePreferences(defaults = {}) {
  const supabase = getSupabase();
  if (!supabase) return null;
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("user_preferences")
    .upsert({
      user_id: user.id,
      sound_enabled: defaults.sound_enabled ?? true,
      haptics_enabled: defaults.haptics_enabled ?? true,
      notifications_enabled: defaults.notifications_enabled ?? false,
      theme: defaults.theme ?? "dark",
      preferred_reminder_time: defaults.preferred_reminder_time ?? null
    })
    .select()
    .single();

  if (error) throw Object.assign(new Error(toAuthError(error).message), toAuthError(error));
  return data;
}

export async function updatePreferences(patch) {
  const supabase = getSupabase();
  if (!supabase) return null;
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("user_preferences")
    .upsert({ user_id: user.id, ...patch })
    .select()
    .single();

  if (error) throw Object.assign(new Error(toAuthError(error).message), toAuthError(error));
  return data;
}

export async function getPreferences() {
  if (!isCloudEnabled()) return null;
  const supabase = getSupabase();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("user_preferences")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  return data;
}
