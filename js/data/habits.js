/** @typedef {{ id: string; title: string; shortTitle?: string; color: string; category: string; schedule: string; xp: string; xpLevel: 'Major' | 'Minor'; benefits: string[]; stats: { label: string; value: string }[]; icon: string; baseline: BaselineConfig }} Habit */
/** @typedef {{ questionId: string; question: string; min: number; max: number; step: number; defaultValue: number; format: (v: number) => string }} BaselineConfig */

export const HABIT_CATEGORIES = [
  { id: "all", label: "All", color: "#ffffff" },
  { id: "physical", label: "Physical", color: "#f87171" },
  { id: "learning", label: "Learning", color: "#39d353" },
  { id: "focus", label: "Focus", color: "#38bdf8" },
  { id: "mental", label: "Mental", color: "#a855f7" }
];

/** Core onboarding habits (order = quiz order) */
export const CORE_HABITS = [
  {
    id: "reading",
    title: "Reading",
    color: "#39d353",
    category: "learning",
    schedule: "Weekends · 30 min",
    xp: "5XP",
    xpLevel: "Major",
    icon: "book",
    benefits: [
      "Expand your knowledge and vocabulary daily",
      "Improve focus and concentration",
      "Build mental discipline and patience"
    ],
    stats: [
      { label: "Knowledge", value: "+68%" },
      { label: "Memory", value: "+52%" },
      { label: "Vocabulary", value: "+45%" }
    ],
    baseline: {
      questionId: "reading_pages",
      question: "How many pages do you read per day?",
      min: 0,
      max: 50,
      step: 1,
      defaultValue: 5,
      format: (v) => `${v} page${v === 1 ? "" : "s"}`
    }
  },
  {
    id: "doomscroll",
    title: "Don't doomscroll",
    color: "#ff6b6b",
    category: "routine",
    schedule: "Every day",
    xp: "3XP",
    xpLevel: "Minor",
    icon: "phone-off",
    benefits: [
      "Reclaim hours from social media, games, and infinite feeds",
      "Track your selected apps automatically with Screen Time",
      "Stay under your daily limit to keep your streak alive"
    ],
    stats: [
      { label: "Mental clarity", value: "+62%" },
      { label: "Reclaimed time", value: "+78%" },
      { label: "Sleep quality", value: "+54%" }
    ],
    baseline: {
      questionId: "social_hours",
      question: "How long do you spend on social media each day?",
      min: 0,
      max: 8,
      step: 0.5,
      defaultValue: 2,
      format: (v) => {
        if (v === 0) return "0 hr";
        if (v < 1) return `${Math.round(v * 60)} min`;
        return `${v} hr`;
      }
    }
  },
  {
    id: "diet",
    title: "Good diet",
    color: "#3b82f6",
    category: "routine",
    schedule: "Every day",
    xp: "3XP",
    xpLevel: "Minor",
    icon: "utensils",
    benefits: [
      "Low sugar intake for stable energy levels",
      "Right amount of calories and balanced macros (protein, fat, carbs)",
      "Proper hydration with enough water daily"
    ],
    stats: [
      { label: "Body composition", value: "+55%" },
      { label: "Energy stability", value: "+80%" },
      { label: "Overall health", value: "+68%" }
    ],
    baseline: {
      questionId: "water_liters",
      question: "How much water do you drink per day?",
      min: 0,
      max: 4,
      step: 0.25,
      defaultValue: 1.5,
      format: (v) => {
        const cups = Math.round(v * 4);
        return `${v} L (${cups} cup${cups === 1 ? "" : "s"})`;
      }
    }
  },
  {
    id: "exercise",
    title: "Exercise",
    color: "#f59e0b",
    category: "physical",
    schedule: "Mon · Wed · Fri · 15 min",
    xp: "5XP",
    xpLevel: "Major",
    icon: "run",
    benefits: [
      "At least 15 pushups, 15 squats, or 15 minutes of activity",
      "Build strength and improve cardiovascular health",
      "Boost energy and confidence throughout the day"
    ],
    stats: [
      { label: "Confidence", value: "+71%" },
      { label: "Energy", value: "+62%" },
      { label: "Fitness", value: "+85%" }
    ],
    baseline: {
      questionId: "exercise_minutes",
      question: "How many minutes of exercise do you do per day?",
      min: 0,
      max: 120,
      step: 5,
      defaultValue: 15,
      format: (v) => `${v} minute${v === 1 ? "" : "s"}`
    }
  },
  {
    id: "deepwork",
    title: "1+ hours deep work",
    color: "#38bdf8",
    category: "focus",
    schedule: "Every day · 60 min",
    xp: "5XP",
    xpLevel: "Major",
    icon: "brain",
    benefits: [
      "Train your brain to focus deeply without interruptions",
      "Produce meaningful work faster with fewer mistakes",
      "Reduce context switching and mental drag"
    ],
    stats: [
      { label: "Deep focus", value: "+58%" },
      { label: "Goal progress", value: "+65%" },
      { label: "Productivity", value: "+72%" }
    ],
    baseline: {
      questionId: "deepwork_hours",
      question: "How much deep work can you do per day?",
      min: 0,
      max: 6,
      step: 0.5,
      defaultValue: 1,
      format: (v) => `${v.toFixed(1)} hour${v === 1 ? "" : "s"}`
    }
  },
  {
    id: "journal",
    title: "Daily journal",
    color: "#a855f7",
    category: "mental",
    schedule: "Every day",
    xp: "3XP",
    xpLevel: "Minor",
    icon: "journal",
    benefits: [
      "Process emotions and gain clarity",
      "Track your progress and growth",
      "Develop self-awareness and purpose"
    ],
    stats: [
      { label: "Clarity", value: "+70%" },
      { label: "Emotional regulation", value: "+62%" },
      { label: "Self-awareness", value: "+68%" }
    ],
    baseline: {
      questionId: "journal_weekly",
      question: "How often do you journal in a week?",
      min: 0,
      max: 7,
      step: 1,
      defaultValue: 2,
      format: (v) =>
        v === 0 ? "Never" : v === 7 ? "Every day" : `${v} time${v === 1 ? "" : "s"} a week`
    }
  }
];

/** Extra habits available in Adjust screen */
export const EXTRA_HABITS = [
  {
    id: "cardio",
    title: "Cardio exercise",
    color: "#f87171",
    category: "physical",
    schedule: "Mon · Wed · Fri · 15 min",
    xp: "5XP",
    xpLevel: "Major",
    icon: "bike"
  },
  {
    id: "protein",
    title: "Protein intake",
    color: "#f87171",
    category: "physical",
    schedule: "Every day",
    xp: "3XP",
    xpLevel: "Minor",
    icon: "leaf"
  },
  {
    id: "pushups",
    title: "Push-ups",
    color: "#f87171",
    category: "physical",
    schedule: "Every day · 10 reps",
    xp: "3XP",
    xpLevel: "Minor",
    icon: "pushup"
  },
  {
    id: "situps",
    title: "Sit-ups",
    color: "#f87171",
    category: "physical",
    schedule: "Every day · 10 reps",
    xp: "3XP",
    xpLevel: "Minor",
    icon: "situp"
  },
  {
    id: "squats",
    title: "Squats",
    color: "#f87171",
    category: "physical",
    schedule: "Every day · 10 reps",
    xp: "3XP",
    xpLevel: "Minor",
    icon: "squat"
  },
  {
    id: "skincare",
    title: "Skin care",
    color: "#39d353",
    category: "learning",
    schedule: "Every day",
    xp: "3XP",
    xpLevel: "Minor",
    icon: "drop"
  },
  {
    id: "nosnooze",
    title: "No Snooze",
    color: "#a855f7",
    category: "mental",
    schedule: "Every day",
    xp: "3XP",
    xpLevel: "Minor",
    icon: "bed"
  },
  {
    id: "water",
    title: "Drinking Water",
    color: "#38bdf8",
    category: "physical",
    schedule: "Every day",
    xp: "3XP",
    xpLevel: "Minor",
    icon: "drop"
  }
];

export const ALL_HABITS = [...CORE_HABITS, ...EXTRA_HABITS];

export function getHabit(id) {
  return ALL_HABITS.find((h) => h.id === id);
}

export function getCoreHabit(id) {
  return CORE_HABITS.find((h) => h.id === id);
}

export const LIFE_EXPECTANCY = 80;

export function yearsLostToPhone(socialHoursPerDay) {
  const hours = Number(socialHoursPerDay) || 0;
  // Narrative projection aligned with prototype (~2 hr/day ≈ 7 years)
  return Math.max(0, Math.round(hours * 3.5));
}
