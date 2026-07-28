import { loadOnboarding, saveOnboarding, clearOnboarding, DEFAULT_STATE } from "./storage.js";
import { CORE_HABITS } from "../data/habits.js";

const listeners = new Set();

let state = loadOnboarding();

function emit() {
  saveOnboarding(state);
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
  state = {
    ...state,
    answers: { ...state.answers, [questionId]: value }
  };
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

export function resetOnboarding() {
  clearOnboarding();
  state = {
    ...DEFAULT_STATE,
    selectedHabitIds: CORE_HABITS.map((h) => h.id),
    answers: {}
  };
  emit();
}

export function hasUnfinishedOnboarding() {
  return state.currentStep > 0 && !state.isCompleted;
}
