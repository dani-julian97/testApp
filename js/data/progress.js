/**
 * Single source of truth helpers for plan / daily / chart progress.
 * All visuals derive from completions + planStartDate + planDays + selectedHabitIds.
 */
import { getHabit } from "./habits.js";
import {
  ASPECT_KEYS,
  CATEGORY_ASPECTS,
  DEFAULT_ASPECTS,
  applyAspectDelta,
  emptyAspects
} from "./aspects.js";
import { todayKey } from "../core/storage.js";

function toDate(key) {
  return new Date(`${key}T12:00:00`);
}

function dateKeyFromDate(d) {
  return d.toISOString().slice(0, 10);
}

export function getPlanDuration(state) {
  return Number(state.planDays) || 21;
}

export function getPlanStartKey(state) {
  return state.planStartDate || todayKey();
}

export function getPlanDayKeys(state) {
  const start = toDate(getPlanStartKey(state));
  const days = getPlanDuration(state);
  const keys = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    keys.push(dateKeyFromDate(d));
  }
  return keys;
}

export function getCurrentPlanDayIndex(state, dateKey = state.selectedDate || todayKey()) {
  const keys = getPlanDayKeys(state);
  const idx = keys.indexOf(dateKey);
  if (idx >= 0) return idx;
  const start = toDate(getPlanStartKey(state));
  const current = toDate(dateKey);
  const diff = Math.floor((current - start) / 86400000);
  return Math.max(0, Math.min(getPlanDuration(state) - 1, diff));
}

/**
 * @returns {{
 *  date: string,
 *  completedTaskIds: string[],
 *  totalTasks: number,
 *  completedTasks: number,
 *  completionPercentage: number,
 *  isFullyCompleted: boolean
 * }}
 */
export function getDailyProgress(state, dateKey = state.selectedDate || todayKey()) {
  const ids = state.selectedHabitIds || [];
  const day = state.completions?.[dateKey] || {};
  const completedTaskIds = ids.filter((id) => Boolean(day[id]));
  const totalTasks = ids.length;
  const completedTasks = completedTaskIds.length;
  const completionPercentage =
    totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  return {
    date: dateKey,
    completedTaskIds,
    totalTasks,
    completedTasks,
    completionPercentage,
    isFullyCompleted: totalTasks > 0 && completedTasks === totalTasks
  };
}

/**
 * Plan day circle states for the Progress tab.
 * @returns {{ dayIndex: number, date: string, status: 'future'|'current'|'complete'|'partial'|'missed', percentage: number }[]}
 */
export function getPlanDayCircles(state) {
  const today = todayKey();
  const keys = getPlanDayKeys(state);
  return keys.map((date, dayIndex) => {
    const daily = getDailyProgress(state, date);
    let status = "future";
    if (date === today) status = "current";
    else if (date < today) {
      if (daily.isFullyCompleted) status = "complete";
      else if (daily.completedTasks > 0) status = "partial";
      else status = "missed";
    }

    if (date === today) {
      if (daily.isFullyCompleted) status = "complete";
      else if (daily.completedTasks > 0) status = "partial";
      else status = "current";
    }

    return {
      dayIndex,
      date,
      status,
      percentage: daily.completionPercentage,
      completedTasks: daily.completedTasks,
      totalTasks: daily.totalTasks
    };
  });
}

/** Cumulative aspect scores derived only from completions (no separate UI state). */
export function deriveAspectScores(state) {
  let aspects = emptyAspects();
  Object.values(state.completions || {}).forEach((day) => {
    Object.keys(day || {}).forEach((habitId) => {
      if (!day[habitId]) return;
      const habit = getHabit(habitId);
      if (!habit) return;
      aspects = applyAspectDelta(aspects, habit.category || "mental", 1);
    });
  });
  return aspects;
}

/**
 * Polygon values for a specific day — driven by that day's habit completions.
 * Incomplete habits stay low; completed ones raise their category axes.
 */
export function getPolygonValuesForDate(state, dateKey = state.selectedDate || todayKey()) {
  const ids = state.selectedHabitIds || [];
  const day = state.completions?.[dateKey] || {};

  const totals = Object.fromEntries(ASPECT_KEYS.map((k) => [k, 0]));
  const doneWeights = Object.fromEntries(ASPECT_KEYS.map((k) => [k, 0]));

  ids.forEach((id) => {
    const habit = getHabit(id);
    if (!habit) return;
    const weights = CATEGORY_ASPECTS[habit.category] || CATEGORY_ASPECTS.mental;
    const completed = Boolean(day[id]);
    Object.entries(weights).forEach(([aspect, weight]) => {
      totals[aspect] += weight;
      if (completed) doneWeights[aspect] += weight;
    });
  });

  const values = {};
  ASPECT_KEYS.forEach((key) => {
    const ratio = totals[key] > 0 ? doneWeights[key] / totals[key] : 0;
    // Visible floor + strong response to today's completions
    values[key] = Math.min(0.98, 0.08 + ratio * 0.82);
  });

  // If no habits selected, fall back to cumulative growth so chart isn't empty
  if (!ids.length) {
    return deriveAspectScores(state);
  }

  return values;
}

export function getOverallPlanCompletion(state) {
  const circles = getPlanDayCircles(state);
  if (!circles.length) return 0;
  const fully = circles.filter((c) => c.status === "complete").length;
  return Math.round((fully / circles.length) * 100);
}

export { ASPECT_KEYS, DEFAULT_ASPECTS, dateKeyFromDate };
