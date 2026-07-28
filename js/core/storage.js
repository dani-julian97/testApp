const STORAGE_KEY = "ikigai_onboarding_v1";

const DEFAULT_STATE = {
  currentStep: 0,
  answers: {},
  selectedHabitIds: [
    "reading",
    "doomscroll",
    "diet",
    "exercise",
    "deepwork",
    "journal"
  ],
  isCompleted: false,
  notificationsEnabled: false,
  contractSigned: false
};

export function loadOnboarding() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE, selectedHabitIds: [...DEFAULT_STATE.selectedHabitIds] };
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_STATE,
      ...parsed,
      answers: parsed.answers || {},
      selectedHabitIds: Array.isArray(parsed.selectedHabitIds)
        ? parsed.selectedHabitIds
        : [...DEFAULT_STATE.selectedHabitIds]
    };
  } catch {
    return { ...DEFAULT_STATE, selectedHabitIds: [...DEFAULT_STATE.selectedHabitIds] };
  }
}

export function saveOnboarding(state) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        currentStep: state.currentStep,
        answers: state.answers,
        selectedHabitIds: state.selectedHabitIds,
        isCompleted: state.isCompleted,
        notificationsEnabled: state.notificationsEnabled,
        contractSigned: state.contractSigned
      })
    );
  } catch {
    /* ignore quota / private mode */
  }
}

export function clearOnboarding() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export { DEFAULT_STATE };
