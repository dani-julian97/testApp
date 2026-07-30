import { CORE_HABITS, setCustomHabitsCache } from "../data/habits.js";
import { emptyAspects } from "../data/aspects.js";

const STORAGE_KEY = "ikigai_app_v2";

function todayKey() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

export const DEFAULT_STATE = {
  currentStep: 0,
  answers: {},
  selectedHabitIds: CORE_HABITS.map((h) => h.id),
  isCompleted: false,
  notificationsEnabled: false,
  contractSigned: false,
  planDays: null,
  planStartDate: null,
  customHabits: [],
  completions: {},
  journalEntries: [],
  tasks: [],
  aspectScores: emptyAspects(),
  selectedDate: todayKey(),
  mainTab: "home",
  xp: 0,
  unlockedTrophies: []
};

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const legacy = localStorage.getItem("ikigai_onboarding_v1");
    const source = raw || legacy;
    if (!source) {
      setCustomHabitsCache([]);
      return structuredClone(DEFAULT_STATE);
    }
    const parsed = JSON.parse(source);
    let mainTab = parsed.mainTab || "home";
    if (mainTab === "block") mainTab = "tasks";

    const state = {
      ...structuredClone(DEFAULT_STATE),
      ...parsed,
      mainTab,
      answers: parsed.answers || {},
      selectedHabitIds: Array.isArray(parsed.selectedHabitIds)
        ? parsed.selectedHabitIds
        : [...DEFAULT_STATE.selectedHabitIds],
      customHabits: Array.isArray(parsed.customHabits) ? parsed.customHabits : [],
      completions: parsed.completions || {},
      journalEntries: Array.isArray(parsed.journalEntries) ? parsed.journalEntries : [],
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
      aspectScores: { ...emptyAspects(), ...(parsed.aspectScores || {}) },
      unlockedTrophies: Array.isArray(parsed.unlockedTrophies)
        ? parsed.unlockedTrophies
        : []
    };
    if (!state.selectedDate) state.selectedDate = todayKey();
    setCustomHabitsCache(state.customHabits);
    return state;
  } catch {
    setCustomHabitsCache([]);
    return structuredClone(DEFAULT_STATE);
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    setCustomHabitsCache(state.customHabits || []);
  } catch {
    /* ignore */
  }
}

export function clearState() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem("ikigai_onboarding_v1");
  } catch {
    /* ignore */
  }
  setCustomHabitsCache([]);
}

export { todayKey };
