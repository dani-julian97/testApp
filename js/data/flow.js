import { CORE_HABITS } from "./habits.js";

/**
 * Full onboarding flow definition.
 * Decorative / interstitial screens are marked so progress only counts quiz steps.
 */
export const FLOW = [
  { id: "welcome", type: "welcome", countsProgress: false },
  { id: "age", type: "age", countsProgress: false },

  ...CORE_HABITS.flatMap((habit, index) => [
    {
      id: `detail_${habit.id}`,
      type: "habit_detail",
      habitId: habit.id,
      countsProgress: false
    },
    {
      id: `baseline_${habit.id}`,
      type: "habit_baseline",
      habitId: habit.id,
      countsProgress: true,
      progressIndex: index
    }
  ]),

  { id: "life_lived", type: "life", variant: "lived", countsProgress: false },
  { id: "life_left", type: "life", variant: "left", countsProgress: false },
  { id: "life_phone", type: "life", variant: "phone", countsProgress: false },

  { id: "calculating", type: "calculating", countsProgress: false },

  { id: "stats_7", type: "stats", phase: "7", countsProgress: false },
  { id: "stats_30", type: "stats", phase: "30", countsProgress: false },
  { id: "stats_90", type: "stats", phase: "90", countsProgress: false },

  { id: "adjust", type: "adjust", countsProgress: false },
  { id: "contract", type: "contract", countsProgress: false },
  { id: "celebration", type: "celebration", countsProgress: false },
  { id: "notifications", type: "notifications", countsProgress: false },
  { id: "plan", type: "plan", countsProgress: false }
];

export const QUIZ_STEP_COUNT = CORE_HABITS.length;

export function getStep(index) {
  return FLOW[index] ?? null;
}

export function getProgressPercent(stepIndex) {
  const step = FLOW[stepIndex];
  if (!step?.countsProgress) {
    // Find nearest completed baseline progress
    let last = -1;
    for (let i = 0; i <= stepIndex; i++) {
      if (FLOW[i].countsProgress) last = FLOW[i].progressIndex;
    }
    if (last < 0) return 0;
    return Math.round(((last + 1) / QUIZ_STEP_COUNT) * 100);
  }
  return Math.round(((step.progressIndex + 1) / QUIZ_STEP_COUNT) * 100);
}

export const STATS_PHASES = {
  "7": {
    title: "First 7 Days",
    color: "#ef4444",
    copy: "You wake up early, drink your water, and do your pushups. Small daily wins build unshakeable momentum.",
    values: { discipline: 0.28, health: 0.32, strength: 0.3, focus: 0.22, knowledge: 0.2, purpose: 0.18 }
  },
  "30": {
    title: "After 30 Days",
    color: "#f59e0b",
    copy: "Your body's stronger, your mind's clearer. Deep work feels natural. People notice you're different.",
    values: { discipline: 0.55, health: 0.58, strength: 0.52, focus: 0.62, knowledge: 0.48, purpose: 0.45 }
  },
  "90": {
    title: "After 90 Days",
    color: "#22c55e",
    copy: "You're unrecognizable. Peak energy, razor focus, and the discipline to achieve anything you set your mind to.",
    values: { discipline: 0.88, health: 0.9, strength: 0.85, focus: 0.92, knowledge: 0.8, purpose: 0.86 }
  }
};

export const CONTRACT_ITEMS = [
  "I'll show up daily, no matter how I feel.",
  "I'll do the work even when motivation runs out.",
  "I'll track my habits and celebrate the small wins.",
  "I'll become the person I know I can be."
];
