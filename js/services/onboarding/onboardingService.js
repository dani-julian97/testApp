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

export async function saveQuizAnswer(questionId, answer) {
  const { supabase, user } = await requireUser();
  if (!supabase || !user) return null;

  const { data, error } = await supabase
    .from("quiz_answers")
    .upsert(
      {
        user_id: user.id,
        question_id: String(questionId),
        answer: answer === undefined ? null : answer
      },
      { onConflict: "user_id,question_id" }
    )
    .select()
    .single();

  if (error) throw Object.assign(new Error(toAuthError(error).message), toAuthError(error));
  return data;
}

export async function saveQuizAnswers(answersMap) {
  const { supabase, user } = await requireUser();
  if (!supabase || !user) return [];

  const rows = Object.entries(answersMap || {}).map(([question_id, answer]) => ({
    user_id: user.id,
    question_id,
    answer: answer === undefined ? null : answer
  }));

  if (!rows.length) return [];

  const { data, error } = await supabase
    .from("quiz_answers")
    .upsert(rows, { onConflict: "user_id,question_id" })
    .select();

  if (error) throw Object.assign(new Error(toAuthError(error).message), toAuthError(error));
  return data || [];
}

export async function loadQuizAnswers() {
  const { supabase, user } = await requireUser();
  if (!supabase || !user) return {};

  const { data, error } = await supabase
    .from("quiz_answers")
    .select("question_id, answer")
    .eq("user_id", user.id);

  if (error) throw Object.assign(new Error(toAuthError(error).message), toAuthError(error));

  const map = {};
  (data || []).forEach((row) => {
    map[row.question_id] = row.answer;
  });
  return map;
}

export async function saveOnboardingProgress({
  currentStep,
  onboardingCompleted
} = {}) {
  const { supabase, user } = await requireUser();
  if (!supabase || !user) return null;

  const patch = {};
  if (currentStep != null) patch.current_onboarding_step = currentStep;
  if (onboardingCompleted != null) patch.onboarding_completed = onboardingCompleted;

  const { data, error } = await supabase
    .from("profiles")
    .update(patch)
    .eq("id", user.id)
    .select()
    .single();

  if (error) throw Object.assign(new Error(toAuthError(error).message), toAuthError(error));
  return data;
}

export async function completeOnboarding({ planDays, planStartDate, currentDay = 1 } = {}) {
  const { supabase, user } = await requireUser();
  if (!supabase || !user) return null;

  await supabase
    .from("profiles")
    .update({
      onboarding_completed: true,
      current_onboarding_step: 0
    })
    .eq("id", user.id);

  // Pause previous active plans
  await supabase
    .from("user_plans")
    .update({ status: "cancelled" })
    .eq("user_id", user.id)
    .eq("status", "active");

  const { data, error } = await supabase
    .from("user_plans")
    .insert({
      user_id: user.id,
      duration_days: planDays,
      start_date: planStartDate,
      current_day: currentDay,
      status: "active"
    })
    .select()
    .single();

  if (error) throw Object.assign(new Error(toAuthError(error).message), toAuthError(error));
  return data;
}

export async function saveUserPlan({ durationDays, startDate, currentDay, status = "active" }) {
  return completeOnboarding({
    planDays: durationDays,
    planStartDate: startDate,
    currentDay
  });
}

export async function loadActivePlan() {
  const { supabase, user } = await requireUser();
  if (!supabase || !user) return null;

  const { data, error } = await supabase
    .from("user_plans")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw Object.assign(new Error(toAuthError(error).message), toAuthError(error));
  return data;
}
