import { loadState, saveState, clearState, DEFAULT_STATE, todayKey } from "./storage.js";
import { CORE_HABITS, getHabit, setCustomHabitsCache } from "../data/habits.js";
import { evaluateTrophies } from "../data/trophies.js";
import { emptyAspects } from "../data/aspects.js";
import { deriveAspectScores } from "../data/progress.js";
import { isCloudEnabled } from "../lib/supabase/client.js";

const listeners = new Set();
let state = loadState();
let syncEnabled = true;

function emit() {
  saveState(state);
  listeners.forEach((fn) => fn(state));
  if (syncEnabled) scheduleCloudSync();
}

function scheduleCloudSync() {
  if (!isCloudEnabled()) return;
  import("./authStore.js")
    .then(({ getAuthState }) => {
      if (!getAuthState().isAuthenticated) return;
      return import("../services/sync/syncService.js");
    })
    .then((mod) => {
      if (!mod) return;
      mod.scheduleFullSync(() => state);
    })
    .catch(() => {});
}

export function getState() {
  return state;
}

/** Deep-ish snapshot for merge (structuredClone). */
export function getStateSnapshot() {
  try {
    return structuredClone(state);
  } catch {
    return JSON.parse(JSON.stringify(state));
  }
}

/**
 * Replace local state (used after cloud hydrate / merge).
 * Does not clear guest data unless the patch overwrites fields.
 */
export function replaceState(patch, { emitSync = true } = {}) {
  const prevSync = syncEnabled;
  if (!emitSync) syncEnabled = false;

  const next = {
    ...structuredClone(DEFAULT_STATE),
    ...state,
    ...patch,
    answers: patch.answers || state.answers || {},
    selectedHabitIds: Array.isArray(patch.selectedHabitIds)
      ? patch.selectedHabitIds
      : state.selectedHabitIds,
    customHabits: Array.isArray(patch.customHabits)
      ? patch.customHabits
      : state.customHabits,
    completions: patch.completions || state.completions || {},
    journalEntries: Array.isArray(patch.journalEntries)
      ? patch.journalEntries
      : state.journalEntries,
    tasks: Array.isArray(patch.tasks) ? patch.tasks : state.tasks,
    unlockedTrophies: Array.isArray(patch.unlockedTrophies)
      ? patch.unlockedTrophies
      : state.unlockedTrophies,
    aspectScores: {
      ...emptyAspects(),
      ...(patch.aspectScores || state.aspectScores || {})
    }
  };

  if (!next.selectedDate) next.selectedDate = todayKey();
  setCustomHabitsCache(next.customHabits || []);
  state = next;
  saveState(state);
  listeners.forEach((fn) => fn(state));
  syncEnabled = prevSync;
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function setStep(index) {
  state = { ...state, currentStep: Math.max(0, index) };
  emit();
  if (isCloudEnabled()) {
    import("../services/onboarding/onboardingService.js").then(({ saveOnboardingProgress }) => {
      saveOnboardingProgress({ currentStep: state.currentStep }).catch(() => {});
    });
  }
}

export function setAnswer(questionId, value) {
  state = { ...state, answers: { ...state.answers, [questionId]: value } };
  emit();
  if (isCloudEnabled()) {
    import("../services/onboarding/onboardingService.js").then(({ saveQuizAnswer }) => {
      saveQuizAnswer(questionId, value).catch(() => {});
    });
  }
}

export function getAnswer(questionId) {
  return state.answers[questionId];
}

export function getAge() {
  return Number(state.answers.age) || 29;
}

export function toggleHabit(habitId) {
  const set = new Set(state.selectedHabitIds);
  if (set.has(habitId)) set.delete(habitId);
  else set.add(habitId);
  state = { ...state, selectedHabitIds: [...set] };
  emit();
}

export function setSelectedHabits(ids) {
  state = { ...state, selectedHabitIds: [...ids] };
  emit();
}

export function isHabitSelected(habitId) {
  return state.selectedHabitIds.includes(habitId);
}

export function markCompleted() {
  state = { ...state, isCompleted: true };
  emit();
}

export function setNotificationsEnabled(value) {
  state = { ...state, notificationsEnabled: Boolean(value) };
  emit();
}

export function setContractSigned(value) {
  state = { ...state, contractSigned: Boolean(value) };
  emit();
}

export function startPlan(days) {
  state = {
    ...state,
    isCompleted: true,
    planDays: days,
    planStartDate: todayKey(),
    selectedDate: todayKey(),
    mainTab: "home",
    aspectScores: state.aspectScores || emptyAspects()
  };
  emit();
  if (isCloudEnabled()) {
    import("../services/onboarding/onboardingService.js").then(({ completeOnboarding }) => {
      completeOnboarding({
        planDays: days,
        planStartDate: state.planStartDate,
        currentDay: 1
      }).catch(() => {});
    });
    import("../services/habits/habitsService.js").then(({ saveSelectedHabits }) => {
      saveSelectedHabits(state.selectedHabitIds).catch(() => {});
    });
  }
}

export function hasActivePlan() {
  return Boolean(state.isCompleted && state.planDays);
}

export function setMainTab(tab) {
  state = { ...state, mainTab: tab === "block" ? "tasks" : tab };
  emit();
}

export function setSelectedDate(dateKey) {
  state = { ...state, selectedDate: dateKey };
  emit();
}

export function isHabitDone(habitId, dateKey = state.selectedDate) {
  return Boolean(state.completions[dateKey]?.[habitId]);
}

export function toggleHabitCompletion(habitId, dateKey = state.selectedDate) {
  const day = { ...(state.completions[dateKey] || {}) };
  const habit = getHabit(habitId);
  const xpGain = habit?.xpLevel === "Major" ? 50 : 30;
  const wasDone = Boolean(day[habitId]);

  if (wasDone) delete day[habitId];
  else day[habitId] = true;

  const completions = { ...state.completions, [dateKey]: day };
  const next = {
    ...state,
    completions,
    xp: wasDone
      ? Math.max(0, state.xp - xpGain)
      : state.xp + xpGain
  };
  next.aspectScores = deriveAspectScores(next);
  next.unlockedTrophies = evaluateTrophies(next);
  state = next;
  emit();

  // Optimistic cloud sync for this completion only (fast path)
  if (isCloudEnabled()) {
    import("../services/sync/syncService.js").then(({ syncCompletionOptimistic }) => {
      syncCompletionOptimistic({
        habitId,
        dateKey,
        completed: !wasDone
      });
    });
  }
}

export function dayCompletionRatio(dateKey) {
  const ids = state.selectedHabitIds;
  if (!ids.length) return 0;
  const done = ids.filter((id) => state.completions[dateKey]?.[id]).length;
  return done / ids.length;
}

export function addJournalEntry(text) {
  const entry = {
    id: `j_${Date.now()}`,
    date: state.selectedDate || todayKey(),
    text: text.trim(),
    createdAt: new Date().toISOString()
  };
  state = { ...state, journalEntries: [entry, ...state.journalEntries] };
  emit();
  return entry;
}

export function addTask({ title, dueDate }) {
  const task = {
    id: `t_${Date.now().toString(36)}`,
    title: title.trim(),
    dueDate: dueDate || todayKey(),
    done: false,
    createdAt: new Date().toISOString()
  };
  state = { ...state, tasks: [task, ...state.tasks] };
  emit();
  return task;
}

export function toggleTask(taskId) {
  state = {
    ...state,
    tasks: state.tasks.map((t) =>
      t.id === taskId ? { ...t, done: !t.done } : t
    )
  };
  emit();
}

export function deleteTask(taskId) {
  state = { ...state, tasks: state.tasks.filter((t) => t.id !== taskId) };
  emit();
}

export function getAspectScores() {
  return deriveAspectScores(state);
}

export function addCustomHabit(habit) {
  const customHabits = [...state.customHabits, habit];
  setCustomHabitsCache(customHabits);
  const selectedHabitIds = state.selectedHabitIds.includes(habit.id)
    ? state.selectedHabitIds
    : [...state.selectedHabitIds, habit.id];
  state = { ...state, customHabits, selectedHabitIds };
  emit();
}

export function resetOnboarding() {
  clearState();
  state = structuredClone(DEFAULT_STATE);
  setCustomHabitsCache([]);
  emit();
}

export function hasUnfinishedOnboarding() {
  return state.currentStep > 0 && !state.isCompleted;
}

export function getPlanDayNumber() {
  if (!state.planStartDate) return 1;
  const start = new Date(state.planStartDate + "T12:00:00");
  const now = new Date(state.selectedDate + "T12:00:00");
  const diff = Math.floor((now - start) / 86400000) + 1;
  return Math.max(1, Math.min(state.planDays || 90, diff));
}
