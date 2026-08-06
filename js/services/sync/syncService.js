import { isCloudEnabled, getSupabase } from "../../lib/supabase/client.js";
import { saveQuizAnswers, loadQuizAnswers, saveOnboardingProgress, loadActivePlan, completeOnboarding } from "../onboarding/onboardingService.js";
import { saveSelectedHabits, loadSelectedHabits } from "../habits/habitsService.js";
import { loadAllCompletions, pushCompletionsMap, saveTaskCompletion } from "../progress/progressService.js";
import { getProfile, updatePreferences, ensurePreferences } from "../profile/profileService.js";
import { enqueueSyncJob, listSyncJobs, clearSyncJobs, removeSyncJob } from "./pendingQueue.js";
import { ENV } from "../../config/env.js";

function logDev(...args) {
  if (ENV.IS_DEV) console.warn("[Ikigai sync]", ...args);
}

/**
 * Push entire local app state to Supabase (authenticated users only).
 * Used after login / guest conversion / reconnect.
 */
export async function pushLocalState(appState) {
  if (!isCloudEnabled()) return { ok: false, reason: "not_configured" };
  const supabase = getSupabase();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, reason: "signed_out" };

  try {
    await saveQuizAnswers(appState.answers || {});
    await saveOnboardingProgress({
      currentStep: appState.currentStep || 0,
      onboardingCompleted: Boolean(appState.isCompleted && appState.planDays)
    });
    await saveSelectedHabits(appState.selectedHabitIds || []);

    if (appState.planDays && appState.planStartDate) {
      const existing = await loadActivePlan();
      const same =
        existing &&
        existing.duration_days === appState.planDays &&
        existing.start_date === appState.planStartDate;
      if (!same) {
        await completeOnboarding({
          planDays: appState.planDays,
          planStartDate: appState.planStartDate,
          currentDay: Math.max(1, getPlanDayNumberFromState(appState))
        });
      }
    }

    await pushCompletionsMap(appState.completions || {});

    await ensurePreferences({
      notifications_enabled: Boolean(appState.notificationsEnabled)
    });
    await updatePreferences({
      notifications_enabled: Boolean(appState.notificationsEnabled)
    });

    const { error } = await supabase.from("user_app_state").upsert({
      user_id: user.id,
      custom_habits: appState.customHabits || [],
      journal_entries: appState.journalEntries || [],
      tasks: appState.tasks || [],
      xp: appState.xp || 0,
      unlocked_trophies: appState.unlockedTrophies || [],
      contract_signed: Boolean(appState.contractSigned),
      selected_date: appState.selectedDate || null,
      main_tab: appState.mainTab || "home"
    });

    if (error) throw error;
    return { ok: true };
  } catch (error) {
    logDev("pushLocalState failed", error);
    enqueueSyncJob({ type: "full_push", snapshotAt: new Date().toISOString() });
    return { ok: false, error };
  }
}

function getPlanDayNumberFromState(state) {
  if (!state.planStartDate) return 1;
  const start = new Date(state.planStartDate + "T12:00:00");
  const now = new Date((state.selectedDate || state.planStartDate) + "T12:00:00");
  const diff = Math.floor((now - start) / 86400000) + 1;
  return Math.max(1, Math.min(state.planDays || 90, diff));
}

/**
 * Pull cloud state into a plain object compatible with DEFAULT_STATE.
 */
export async function pullRemoteState() {
  if (!isCloudEnabled()) return null;
  const supabase = getSupabase();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return null;

  try {
    const [profile, answers, habits, plan, completions, prefs] = await Promise.all([
      getProfile(),
      loadQuizAnswers(),
      loadSelectedHabits(),
      loadActivePlan(),
      loadAllCompletions(),
      supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle()
        .then((r) => r.data),
    ]);

    const { data: appState } = await supabase
      .from("user_app_state")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    const hasCloudData = Boolean(
      profile?.onboarding_completed ||
        Object.keys(answers || {}).length ||
        (habits || []).length ||
        plan ||
        Object.keys(completions || {}).length
    );

    return {
      hasCloudData,
      profile,
      currentStep: profile?.current_onboarding_step ?? 0,
      answers: answers || {},
      selectedHabitIds: habits?.length ? habits : null,
      isCompleted: Boolean(profile?.onboarding_completed || plan),
      notificationsEnabled: Boolean(prefs?.notifications_enabled),
      contractSigned: Boolean(appState?.contract_signed),
      planDays: plan?.duration_days ?? null,
      planStartDate: plan?.start_date ?? null,
      customHabits: appState?.custom_habits || [],
      completions: completions || {},
      journalEntries: appState?.journal_entries || [],
      tasks: appState?.tasks || [],
      xp: appState?.xp || 0,
      unlockedTrophies: appState?.unlocked_trophies || [],
      selectedDate: appState?.selected_date || null,
      mainTab: appState?.main_tab || "home"
    };
  } catch (error) {
    logDev("pullRemoteState failed", error);
    return null;
  }
}

/**
 * Merge guest/local with remote. Never discard guest progress blindly.
 * Completions: union (completed if either side says done).
 * Plan: prefer the side that has an active plan; if both, prefer newer start or longer progress.
 */
export function mergeLocalAndRemote(local, remote) {
  if (!remote || !remote.hasCloudData) return { ...local, _mergedFrom: "local" };
  if (!local) return { ...remote, _mergedFrom: "remote" };

  const localHasPlan = Boolean(local.isCompleted && local.planDays);
  const remoteHasPlan = Boolean(remote.isCompleted && remote.planDays);

  const completions = { ...(remote.completions || {}) };
  Object.entries(local.completions || {}).forEach(([date, day]) => {
    completions[date] = { ...(completions[date] || {}), ...day };
    // local true wins over missing; if remote false and local true → keep true (already)
  });

  const answers = { ...(remote.answers || {}), ...(local.answers || {}) };

  let planDays = local.planDays ?? remote.planDays;
  let planStartDate = local.planStartDate ?? remote.planStartDate;
  let isCompleted = local.isCompleted || remote.isCompleted;

  if (localHasPlan && remoteHasPlan) {
    // Keep local plan if guest already progressed; else remote
    const localKeys = Object.keys(local.completions || {}).length;
    const remoteKeys = Object.keys(remote.completions || {}).length;
    if (remoteKeys > localKeys && !localKeys) {
      planDays = remote.planDays;
      planStartDate = remote.planStartDate;
    } else {
      planDays = local.planDays;
      planStartDate = local.planStartDate;
    }
    isCompleted = true;
  } else if (remoteHasPlan && !localHasPlan) {
    planDays = remote.planDays;
    planStartDate = remote.planStartDate;
    isCompleted = true;
  }

  const selectedHabitIds =
    (local.selectedHabitIds?.length && localHasPlan) ||
    (local.selectedHabitIds?.length && !remote.selectedHabitIds?.length)
      ? local.selectedHabitIds
      : remote.selectedHabitIds || local.selectedHabitIds;

  const currentStep = Math.max(local.currentStep || 0, remote.currentStep || 0);

  return {
    ...local,
    answers,
    completions,
    selectedHabitIds,
    planDays,
    planStartDate,
    isCompleted,
    currentStep,
    customHabits: mergeById(local.customHabits, remote.customHabits),
    journalEntries: mergeById(local.journalEntries, remote.journalEntries),
    tasks: mergeTasks(local.tasks, remote.tasks),
    xp: Math.max(local.xp || 0, remote.xp || 0),
    unlockedTrophies: [
      ...new Set([...(local.unlockedTrophies || []), ...(remote.unlockedTrophies || [])])
    ],
    notificationsEnabled:
      local.notificationsEnabled || remote.notificationsEnabled,
    contractSigned: local.contractSigned || remote.contractSigned,
    selectedDate: local.selectedDate || remote.selectedDate,
    mainTab: local.mainTab || remote.mainTab || "home"
  };
}

function mergeById(a = [], b = []) {
  const map = new Map();
  [...(b || []), ...(a || [])].forEach((item) => {
    if (item?.id) map.set(item.id, item);
  });
  return [...map.values()];
}

function mergeTasks(a = [], b = []) {
  const map = new Map();
  [...(b || []), ...(a || [])].forEach((t) => {
    if (!t?.id) return;
    const prev = map.get(t.id);
    if (!prev) map.set(t.id, t);
    else map.set(t.id, { ...prev, ...t, done: Boolean(prev.done || t.done) });
  });
  return [...map.values()];
}

export async function syncCompletionOptimistic({
  habitId,
  dateKey,
  completed
}) {
  if (!isCloudEnabled()) return;
  try {
    await saveTaskCompletion({
      habitId,
      taskId: habitId,
      completionDate: dateKey,
      completed
    });
  } catch (error) {
    logDev("completion sync failed", error);
    enqueueSyncJob({
      type: "completion",
      habitId,
      dateKey,
      completed
    });
  }
}

export async function flushPendingQueue(getAppState) {
  if (!isCloudEnabled() || !navigator.onLine) return;
  const jobs = listSyncJobs();
  if (!jobs.length) return;

  for (const job of jobs) {
    try {
      if (job.type === "full_push" || job.type === "flush_all") {
        await pushLocalState(getAppState());
      } else if (job.type === "completion") {
        await saveTaskCompletion({
          habitId: job.habitId,
          taskId: job.habitId,
          completionDate: job.dateKey,
          completed: job.completed
        });
      }
      removeSyncJob(job.id);
    } catch (error) {
      logDev("flush job failed", job, error);
      break;
    }
  }
}

let syncTimer = null;

export function scheduleFullSync(getAppState) {
  if (!isCloudEnabled()) return;
  clearTimeout(syncTimer);
  syncTimer = setTimeout(async () => {
    const result = await pushLocalState(getAppState());
    if (result.ok) {
      // Clear stale full_push jobs after success
      listSyncJobs()
        .filter((j) => j.type === "full_push")
        .forEach((j) => removeSyncJob(j.id));
    }
  }, 900);
}

export { clearSyncJobs };
