import { getSupabase } from "../../lib/supabase/client.js";
import { toAuthError } from "../auth/errors.js";

async function requireUser() {
  const supabase = getSupabase();
  if (!supabase) return { supabase: null, user: null };
  const {
    data: { user }
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function saveSelectedHabits(habitIds) {
  const { supabase, user } = await requireUser();
  if (!supabase || !user) return [];

  const ids = [...new Set(habitIds || [])];

  // Mark all existing as unselected, then upsert selected
  await supabase
    .from("user_habits")
    .update({ is_selected: false })
    .eq("user_id", user.id);

  if (!ids.length) return [];

  const rows = ids.map((habit_id) => ({
    user_id: user.id,
    habit_id,
    is_selected: true,
    target_frequency: 1
  }));

  const { data, error } = await supabase
    .from("user_habits")
    .upsert(rows, { onConflict: "user_id,habit_id" })
    .select();

  if (error) throw Object.assign(new Error(toAuthError(error).message), toAuthError(error));
  return data || [];
}

export async function loadSelectedHabits() {
  const { supabase, user } = await requireUser();
  if (!supabase || !user) return [];

  const { data, error } = await supabase
    .from("user_habits")
    .select("habit_id")
    .eq("user_id", user.id)
    .eq("is_selected", true);

  if (error) throw Object.assign(new Error(toAuthError(error).message), toAuthError(error));
  return (data || []).map((r) => r.habit_id);
}
