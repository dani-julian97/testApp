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

/**
 * Deterministic upsert — prevents duplicates from retries / multi-device.
 */
export async function saveTaskCompletion({
  habitId,
  taskId,
  completionDate,
  completed = true
}) {
  const { supabase, user } = await requireUser();
  if (!supabase || !user) return null;

  const task_id = taskId || habitId;
  const payload = {
    user_id: user.id,
    habit_id: habitId,
    task_id,
    completion_date: completionDate,
    completed: Boolean(completed),
    completed_at: completed ? new Date().toISOString() : null
  };

  const { data, error } = await supabase
    .from("task_completions")
    .upsert(payload, { onConflict: "user_id,task_id,completion_date" })
    .select()
    .single();

  if (error) throw Object.assign(new Error(toAuthError(error).message), toAuthError(error));
  return data;
}

export async function removeTaskCompletion({ habitId, taskId, completionDate }) {
  return saveTaskCompletion({
    habitId,
    taskId: taskId || habitId,
    completionDate,
    completed: false
  });
}

export async function loadDailyProgress(date) {
  const { supabase, user } = await requireUser();
  if (!supabase || !user) return [];

  const { data, error } = await supabase
    .from("task_completions")
    .select("*")
    .eq("user_id", user.id)
    .eq("completion_date", date)
    .eq("completed", true);

  if (error) throw Object.assign(new Error(toAuthError(error).message), toAuthError(error));
  return data || [];
}

export async function loadAllCompletions() {
  const { supabase, user } = await requireUser();
  if (!supabase || !user) return {};

  const { data, error } = await supabase
    .from("task_completions")
    .select("habit_id, task_id, completion_date, completed, updated_at")
    .eq("user_id", user.id);

  if (error) throw Object.assign(new Error(toAuthError(error).message), toAuthError(error));

  /** @type {Record<string, Record<string, boolean>>} */
  const map = {};
  (data || []).forEach((row) => {
    if (!row.completed) return;
    if (!map[row.completion_date]) map[row.completion_date] = {};
    map[row.completion_date][row.habit_id || row.task_id] = true;
  });
  return map;
}

export async function loadPlanProgress() {
  return loadAllCompletions();
}

/**
 * Push full local completions map to cloud (guest migration / full sync).
 */
export async function pushCompletionsMap(completions) {
  const { supabase, user } = await requireUser();
  if (!supabase || !user) return;

  const rows = [];
  Object.entries(completions || {}).forEach(([date, day]) => {
    Object.entries(day || {}).forEach(([habitId, done]) => {
      if (!done) return;
      rows.push({
        user_id: user.id,
        habit_id: habitId,
        task_id: habitId,
        completion_date: date,
        completed: true,
        completed_at: new Date().toISOString()
      });
    });
  });

  if (!rows.length) return;

  // Chunk to avoid payload limits
  const chunkSize = 200;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error } = await supabase
      .from("task_completions")
      .upsert(chunk, { onConflict: "user_id,task_id,completion_date" });
    if (error) throw Object.assign(new Error(toAuthError(error).message), toAuthError(error));
  }
}
