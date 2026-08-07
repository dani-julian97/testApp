/** @typedef {{ id: string; title: string; color: string; category: string; schedule: string; xp: string; xpLevel: 'Major' | 'Minor'; icon: string; target?: number; targetUnit?: string; benefits?: string[]; stats?: { label: string; value: string }[]; baseline?: object; custom?: boolean; imageTone?: string }} Habit */

export const HABIT_CATEGORIES = [
  { id: "all", label: "All", color: "#ffffff" },
  { id: "physical", label: "Physical", color: "#f87171" },
  { id: "learning", label: "Learning", color: "#39d353" },
  { id: "focus", label: "Focus", color: "#38bdf8" },
  { id: "mental", label: "Mental", color: "#a855f7" },
  { id: "routine", label: "Routine", color: "#f59e0b" }
];

export const HABIT_COLORS = [
  "#f87171",
  "#39d353",
  "#38bdf8",
  "#a855f7",
  "#f59e0b",
  "#ff6b6b",
  "#3b82f6",
  "#eab308",
  "#14b8a6",
  "#ec4899"
];

export const ICON_CHOICES = [
  "book", "phone-off", "utensils", "run", "brain", "journal", "bike", "leaf",
  "pushup", "situp", "squat", "drop", "bed", "dumbbell", "briefcase", "language",
  "hammer", "sunrise", "meditate", "grad", "breath", "wine", "sparkle", "burger",
  "shower", "smoke", "nofap", "friends", "walk", "yoga", "music", "cook", "heart",
  "calm-speak", "peace", "kind", "film", "book-focus", "list-heart", "pray"
];

/** Core onboarding habits (quiz order) */
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
    target: 30,
    targetUnit: "min",
    imageTone: "forest",
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
    target: 1,
    targetUnit: "limit",
    imageTone: "tech",
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
    color: "#f59e0b",
    category: "routine",
    schedule: "Every day",
    xp: "3XP",
    xpLevel: "Minor",
    icon: "utensils",
    target: 1,
    targetUnit: "day",
    imageTone: "warm",
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
    color: "#f87171",
    category: "physical",
    schedule: "Mon · Wed · Fri · 15 min",
    xp: "5XP",
    xpLevel: "Major",
    icon: "run",
    target: 15,
    targetUnit: "min",
    imageTone: "energy",
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
    target: 60,
    targetUnit: "min",
    imageTone: "focus",
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
    target: 1,
    targetUnit: "entry",
    imageTone: "calm",
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
  },
  {
    id: "nofap",
    title: "Do not fap",
    color: "#a855f7",
    category: "mental",
    schedule: "Every day",
    xp: "5XP",
    xpLevel: "Major",
    icon: "nofap",
    target: 1,
    targetUnit: "day",
    imageTone: "calm",
    benefits: [
      "Build sexual discipline and self-control",
      "Reduce brain fog and boost confidence",
      "Redirect energy into your goals and habits"
    ],
    stats: [
      { label: "Discipline", value: "+74%" },
      { label: "Focus", value: "+58%" },
      { label: "Confidence", value: "+65%" }
    ],
    baseline: {
      questionId: "nofap_streak_goal",
      question: "How many clean days in a row do you want to aim for?",
      min: 1,
      max: 90,
      step: 1,
      defaultValue: 21,
      format: (v) => `${v} day${v === 1 ? "" : "s"}`
    }
  },
  {
    id: "noscreens_bed",
    title: "No screens before bed",
    color: "#38bdf8",
    category: "routine",
    schedule: "Every night · last 30 min",
    xp: "3XP",
    xpLevel: "Minor",
    icon: "bed",
    target: 30,
    targetUnit: "min",
    imageTone: "tech",
    benefits: [
      "Protect melatonin and fall asleep faster",
      "Stop late-night scrolling before lights out",
      "Wake up clearer with a calmer nervous system"
    ],
    stats: [
      { label: "Sleep quality", value: "+72%" },
      { label: "Morning energy", value: "+61%" },
      { label: "Screen freeness", value: "+80%" }
    ],
    baseline: {
      questionId: "screens_before_bed",
      question: "How many minutes of screen time do you usually have before sleep?",
      min: 0,
      max: 120,
      step: 5,
      defaultValue: 45,
      format: (v) => (v === 0 ? "None" : `${v} minute${v === 1 ? "" : "s"}`)
    }
  }
];

/** Catalog habits from samples/new_habits + extras */
export const EXTRA_HABITS = [
  // Physical
  { id: "cardio", title: "Cardio exercise", color: "#f87171", category: "physical", schedule: "Mon · Wed · Fri · 15 min", xp: "5XP", xpLevel: "Major", icon: "bike", target: 15, targetUnit: "min", imageTone: "energy" },
  { id: "protein", title: "Protein intake", color: "#f87171", category: "physical", schedule: "Every day", xp: "3XP", xpLevel: "Minor", icon: "leaf", target: 1, targetUnit: "day", imageTone: "warm" },
  { id: "pushups", title: "Push-ups", color: "#f87171", category: "physical", schedule: "Every day · 10 reps", xp: "3XP", xpLevel: "Minor", icon: "pushup", target: 10, targetUnit: "reps", imageTone: "energy" },
  { id: "situps", title: "Sit-ups", color: "#f87171", category: "physical", schedule: "Every day · 10 reps", xp: "3XP", xpLevel: "Minor", icon: "situp", target: 10, targetUnit: "reps", imageTone: "energy" },
  { id: "squats", title: "Squats", color: "#f87171", category: "physical", schedule: "Every day · 10 reps", xp: "3XP", xpLevel: "Minor", icon: "squat", target: 10, targetUnit: "reps", imageTone: "energy" },
  { id: "weights", title: "Weight training", color: "#f87171", category: "physical", schedule: "Mon · Wed · Fri · 30 min", xp: "5XP", xpLevel: "Major", icon: "dumbbell", target: 30, targetUnit: "min", imageTone: "energy" },
  { id: "walk", title: "Daily walk", color: "#f87171", category: "physical", schedule: "Every day · 20 min", xp: "3XP", xpLevel: "Minor", icon: "walk", target: 20, targetUnit: "min", imageTone: "forest" },
  { id: "yoga", title: "Yoga", color: "#f87171", category: "physical", schedule: "Every day · 15 min", xp: "3XP", xpLevel: "Minor", icon: "yoga", target: 15, targetUnit: "min", imageTone: "calm" },
  { id: "water", title: "Drinking Water", color: "#38bdf8", category: "physical", schedule: "Every day", xp: "3XP", xpLevel: "Minor", icon: "drop", target: 8, targetUnit: "cups", imageTone: "focus" },

  // Learning
  { id: "skincare", title: "Skin care", color: "#39d353", category: "learning", schedule: "Every day", xp: "3XP", xpLevel: "Minor", icon: "drop", target: 1, targetUnit: "day", imageTone: "calm" },

  // Focus
  { id: "business", title: "Business", color: "#38bdf8", category: "focus", schedule: "Weekdays · 45 min", xp: "5XP", xpLevel: "Major", icon: "briefcase", target: 45, targetUnit: "min", imageTone: "focus" },
  { id: "language", title: "Language practice", color: "#38bdf8", category: "focus", schedule: "Weekdays · 20 min", xp: "5XP", xpLevel: "Major", icon: "language", target: 20, targetUnit: "min", imageTone: "focus" },
  { id: "sideproject", title: "Side project", color: "#38bdf8", category: "focus", schedule: "Weekends · 60 min", xp: "5XP", xpLevel: "Major", icon: "hammer", target: 60, targetUnit: "min", imageTone: "tech" },
  { id: "wakeup", title: "Wake up early", color: "#38bdf8", category: "focus", schedule: "Every day", xp: "3XP", xpLevel: "Minor", icon: "sunrise", target: 1, targetUnit: "day", imageTone: "warm" },
  { id: "sleep", title: "Hours slept", color: "#38bdf8", category: "focus", schedule: "Every day", xp: "3XP", xpLevel: "Minor", icon: "bed", target: 8, targetUnit: "hours", imageTone: "calm" },

  // Mental
  { id: "meditate", title: "Meditate", color: "#a855f7", category: "mental", schedule: "Every day · 10 min", xp: "5XP", xpLevel: "Major", icon: "meditate", target: 10, targetUnit: "min", imageTone: "calm" },
  { id: "study", title: "Study", color: "#a855f7", category: "mental", schedule: "Weekdays · 45 min", xp: "5XP", xpLevel: "Major", icon: "grad", target: 45, targetUnit: "min", imageTone: "focus" },
  { id: "breaths", title: "Take 5 deep breaths", color: "#a855f7", category: "mental", schedule: "Every day", xp: "3XP", xpLevel: "Minor", icon: "breath", target: 5, targetUnit: "breaths", imageTone: "calm" },
  { id: "friends", title: "Chat with friends", color: "#a855f7", category: "mental", schedule: "Every day", xp: "3XP", xpLevel: "Minor", icon: "friends", target: 1, targetUnit: "chat", imageTone: "warm" },
  { id: "nosnooze", title: "No Snooze", color: "#a855f7", category: "mental", schedule: "Every day", xp: "3XP", xpLevel: "Minor", icon: "bed", target: 1, targetUnit: "day", imageTone: "warm" },
  { id: "gratitude", title: "Gratitude", color: "#a855f7", category: "mental", schedule: "Every day", xp: "3XP", xpLevel: "Minor", icon: "heart", target: 1, targetUnit: "day", imageTone: "warm" },
  { id: "music", title: "Practice music", color: "#a855f7", category: "mental", schedule: "Every day · 20 min", xp: "3XP", xpLevel: "Minor", icon: "music", target: 20, targetUnit: "min", imageTone: "focus" },

  // Routine
  { id: "noalcohol", title: "No alcohol", color: "#f59e0b", category: "routine", schedule: "Every day", xp: "3XP", xpLevel: "Minor", icon: "wine", target: 1, targetUnit: "day", imageTone: "warm" },
  { id: "cleaning", title: "Cleaning", color: "#f59e0b", category: "routine", schedule: "Every day", xp: "3XP", xpLevel: "Minor", icon: "sparkle", target: 1, targetUnit: "day", imageTone: "calm" },
  { id: "nojunk", title: "No junk food", color: "#f59e0b", category: "routine", schedule: "Every day", xp: "3XP", xpLevel: "Minor", icon: "burger", target: 1, targetUnit: "day", imageTone: "warm" },
  { id: "coldshower", title: "Cold shower", color: "#f59e0b", category: "routine", schedule: "Weekdays", xp: "3XP", xpLevel: "Minor", icon: "shower", target: 1, targetUnit: "day", imageTone: "focus" },
  { id: "nosmoking", title: "No smoking", color: "#f59e0b", category: "routine", schedule: "Every day", xp: "3XP", xpLevel: "Minor", icon: "smoke", target: 1, targetUnit: "day", imageTone: "energy" },
  { id: "cook", title: "Cook a meal", color: "#f59e0b", category: "routine", schedule: "Every day", xp: "3XP", xpLevel: "Minor", icon: "cook", target: 1, targetUnit: "meal", imageTone: "warm" },

  // Character / presence
  { id: "noscold", title: "Don't scold", color: "#a855f7", category: "mental", schedule: "Every day", xp: "3XP", xpLevel: "Minor", icon: "calm-speak", target: 1, targetUnit: "day", imageTone: "calm" },
  { id: "noargue", title: "Don't argue", color: "#a855f7", category: "mental", schedule: "Every day", xp: "3XP", xpLevel: "Minor", icon: "peace", target: 1, targetUnit: "day", imageTone: "calm" },
  { id: "noinsult", title: "Don't insult", color: "#a855f7", category: "mental", schedule: "Every day", xp: "5XP", xpLevel: "Major", icon: "kind", target: 1, targetUnit: "day", imageTone: "warm" },
  { id: "phone_movie", title: "No phone while watching", color: "#ff6b6b", category: "routine", schedule: "Every day", xp: "3XP", xpLevel: "Minor", icon: "film", target: 1, targetUnit: "day", imageTone: "tech" },
  { id: "phone_reading", title: "No phone while reading", color: "#39d353", category: "learning", schedule: "Every day", xp: "3XP", xpLevel: "Minor", icon: "book-focus", target: 1, targetUnit: "day", imageTone: "forest" },
  { id: "ten_goods", title: "10 good things before bed", color: "#a855f7", category: "mental", schedule: "Every night", xp: "3XP", xpLevel: "Minor", icon: "list-heart", target: 10, targetUnit: "things", imageTone: "calm" },
  { id: "pray", title: "Pray at night", color: "#a855f7", category: "mental", schedule: "Every night", xp: "3XP", xpLevel: "Minor", icon: "pray", target: 1, targetUnit: "day", imageTone: "calm" },
  { id: "thank", title: "Give thanks", color: "#a855f7", category: "mental", schedule: "Every day", xp: "3XP", xpLevel: "Minor", icon: "heart", target: 1, targetUnit: "day", imageTone: "warm" }
];

export const BUILTIN_HABITS = [...CORE_HABITS, ...EXTRA_HABITS];

/** @type {Habit[]} */
let customHabitsCache = [];

export function setCustomHabitsCache(list) {
  customHabitsCache = Array.isArray(list) ? list : [];
}

export function getAllHabits() {
  return [...BUILTIN_HABITS, ...customHabitsCache];
}

export function getHabit(id) {
  return getAllHabits().find((h) => h.id === id);
}

export function getCoreHabit(id) {
  return CORE_HABITS.find((h) => h.id === id);
}

export function createCustomHabit({
  title,
  category = "mental",
  color,
  icon = "heart",
  schedule = "Every day",
  xpLevel = "Minor"
}) {
  const id = `custom_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  const catColor =
    HABIT_CATEGORIES.find((c) => c.id === category)?.color || "#a855f7";
  return {
    id,
    title: title.trim(),
    color: color || catColor,
    category,
    schedule,
    xp: xpLevel === "Major" ? "5XP" : "3XP",
    xpLevel,
    icon,
    target: 1,
    targetUnit: "day",
    imageTone: "calm",
    custom: true
  };
}

export const LIFE_EXPECTANCY = 80;

export function yearsLostToPhone(socialHoursPerDay) {
  const hours = Number(socialHoursPerDay) || 0;
  return Math.max(0, Math.round(hours * 3.5));
}

export function formatHabitProgress(habit, done) {
  const target = habit.target || 1;
  const unit = habit.targetUnit || "";
  if (unit === "min") return done ? `${target}/${target} min` : `0/${target} min`;
  if (unit === "limit") return done ? "1/1" : "0/1";
  if (unit === "entry" || unit === "day" || unit === "chat" || unit === "meal" || unit === "things") {
    return done ? "1/1" : "0/1";
  }
  return done ? `${target}/${target}` : `0/${target}${unit ? ` ${unit}` : ""}`;
}
