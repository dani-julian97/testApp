import { getHabit } from "./habits.js";

/**
 * Trophy catalog. Each trophy has a stable id, habit affinity, icon, and unlock rule.
 */
export const TROPHIES = [
  // Deep work
  { id: "focused_day", title: "Focused Day", habitId: "deepwork", icon: "laptop", rule: { type: "completions", habitId: "deepwork", count: 1 } },
  { id: "deep_diver", title: "Deep Diver", habitId: "deepwork", icon: "books", rule: { type: "completions", habitId: "deepwork", count: 7 } },
  { id: "iron_focus", title: "Iron Focus", habitId: "deepwork", icon: "hourglass", rule: { type: "completions", habitId: "deepwork", count: 21 } },
  { id: "linked_in", title: "Linked In", habitId: "deepwork", icon: "lock", rule: { type: "streak", habitId: "deepwork", count: 3 } },
  { id: "master_work", title: "Master at Work", habitId: "deepwork", icon: "typewriter", rule: { type: "completions", habitId: "deepwork", count: 40 } },
  { id: "mind_architect", title: "Mind Architect", habitId: "deepwork", icon: "journal", rule: { type: "completions", habitId: "deepwork", count: 90 } },
  { id: "night_owl", title: "Night Owl", habitId: "deepwork", icon: "owl", rule: { type: "completions", habitId: "deepwork", count: 14 } },

  // Doomscroll
  { id: "doomscroll_defeated", title: "Doomscroll Defeated", habitId: "doomscroll", icon: "phone", rule: { type: "completions", habitId: "doomscroll", count: 7 } },
  { id: "clear_mind", title: "Clear Mind", habitId: "doomscroll", icon: "brain", rule: { type: "completions", habitId: "doomscroll", count: 21 } },

  // Exercise
  { id: "first_sweat", title: "First Sweat", habitId: "exercise", icon: "run", rule: { type: "completions", habitId: "exercise", count: 1 } },
  { id: "consistent_mover", title: "Consistent Mover", habitId: "exercise", icon: "dumbbell", rule: { type: "completions", habitId: "exercise", count: 14 } },

  // Journal
  { id: "first_page", title: "First Page", habitId: "journal", icon: "journal", rule: { type: "completions", habitId: "journal", count: 1 } },
  { id: "reflective", title: "Reflective", habitId: "journal", icon: "books", rule: { type: "completions", habitId: "journal", count: 21 } },

  // Reading
  { id: "bookworm", title: "Bookworm", habitId: "reading", icon: "book", rule: { type: "completions", habitId: "reading", count: 7 } },

  // Mental extras
  { id: "monk_mode", title: "Monk Mode", habitId: "nofap", icon: "nofap", rule: { type: "completions", habitId: "nofap", count: 7 } },
  { id: "social_spark", title: "Social Spark", habitId: "friends", icon: "friends", rule: { type: "completions", habitId: "friends", count: 7 } },
  { id: "zen_starter", title: "Zen Starter", habitId: "meditate", icon: "meditate", rule: { type: "completions", habitId: "meditate", count: 5 } },

  // Global
  { id: "week_warrior", title: "Week Warrior", habitId: null, icon: "trophy", rule: { type: "total", count: 20 } },
  { id: "legend_path", title: "Legend Path", habitId: null, icon: "crown", rule: { type: "xp", count: 5000 } }
];

function countHabitCompletions(state, habitId) {
  let n = 0;
  Object.values(state.completions || {}).forEach((day) => {
    if (day?.[habitId]) n += 1;
  });
  return n;
}

function totalCompletions(state) {
  let n = 0;
  Object.values(state.completions || {}).forEach((day) => {
    n += Object.keys(day || {}).length;
  });
  return n;
}

function habitStreak(state, habitId) {
  let streak = 0;
  const d = new Date();
  for (let i = 0; i < 400; i++) {
    const key = d.toISOString().slice(0, 10);
    if (state.completions[key]?.[habitId]) {
      streak += 1;
      d.setDate(d.getDate() - 1);
    } else break;
  }
  return streak;
}

export function isTrophyUnlocked(state, trophy) {
  const rule = trophy.rule;
  if (rule.type === "completions") {
    return countHabitCompletions(state, rule.habitId) >= rule.count;
  }
  if (rule.type === "streak") {
    return habitStreak(state, rule.habitId) >= rule.count;
  }
  if (rule.type === "total") {
    return totalCompletions(state) >= rule.count;
  }
  if (rule.type === "xp") {
    return (state.xp || 0) >= rule.count;
  }
  return false;
}

export function evaluateTrophies(state) {
  return TROPHIES.filter((t) => isTrophyUnlocked(state, t)).map((t) => t.id);
}

export function trophiesForHabit(habitId) {
  return TROPHIES.filter((t) => t.habitId === habitId);
}

export function getRank(xp) {
  if (xp >= 12500) return "Legend";
  if (xp >= 5000) return "Master";
  if (xp >= 2000) return "Warrior";
  if (xp >= 500) return "Apprentice";
  return "Beginner";
}

export function trophyById(id) {
  return TROPHIES.find((t) => t.id === id);
}

// silence unused import in some bundlers
void getHabit;
