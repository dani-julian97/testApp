import { loadState, saveState, clearState, DEFAULT_STATE, todayKey } from "./storage.js";
import { CORE_HABITS, getHabit, setCustomHabitsCache } from "../data/habits.js";
import { evaluateTrophies } from "../data/trophies.js";
import { applyAspectDelta, emptyAspects } from "../data/aspects.js";

const listeners = new Set();
let state = loadState();

function emit() {
  saveState(state);
  listeners.forEach((fn) => fn(state));
}

export function getState() {
  return state;
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function setStep(index) {
  state = { ...state, currentStep: Math.max(0, index) };
  emit();
}

export function setAnswer(questionId, value) {
  state = { ...state, answers: { ...state.answers, [questionId]: value } };
  emit();
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
  const category = habit?.category || "mental";
  const wasDone = Boolean(day[habitId]);

  if (wasDone) {
    delete day[habitId];
    state = {
      ...state,
      completions: { ...state.completions, [dateKey]: day },
      xp: Math.max(0, state.xp - xpGain),
      aspectScores: applyAspectDelta(state.aspectScores || emptyAspects(), category, -1)
    };
  } else {
    day[habitId] = true;
    state = {
      ...state,
      completions: { ...state.completions, [dateKey]: day },
      xp: state.xp + xpGain,
      aspectScores: applyAspectDelta(state.aspectScores || emptyAspects(), category, 1)
    };
  }

  const unlocked = evaluateTrophies(state);
  state = { ...state, unlockedTrophies: unlocked };
  emit();
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
  return { ...emptyAspects(), ...(state.aspectScores || {}) };
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
