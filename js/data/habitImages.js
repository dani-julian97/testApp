/**
 * Habit cover images.
 * Dedicated assets live in assets/images/habits/.
 * Habits without a dedicated file fall back by category / related id.
 */

const HABIT_IMAGE_BASE = "./assets/images/habits";

/** Direct habitId → filename */
const HABIT_IMAGES = {
  reading: "reading.png",
  doomscroll: "no-doomscroll.png",
  diet: "good-diet.png",
  exercise: "running.png",
  deepwork: "deep-work.png",
  journal: "write-journal.png",
  coldshower: "cold-shower.png",
  meditate: "meditation.png",
  yoga: "streching.png",

  // Closest visual matches for related habits
  cardio: "running.png",
  walk: "running.png",
  pushups: "running.png",
  situps: "streching.png",
  squats: "streching.png",
  weights: "running.png",
  protein: "good-diet.png",
  cook: "good-diet.png",
  nojunk: "good-diet.png",
  water: "cold-shower.png",
  skincare: "cold-shower.png",
  phone_reading: "reading.png",
  study: "reading.png",
  language: "reading.png",
  business: "deep-work.png",
  sideproject: "deep-work.png",
  wakeup: "deep-work.png",
  breaths: "meditation.png",
  pray: "meditation.png",
  thank: "meditation.png",
  gratitude: "meditation.png",
  ten_goods: "write-journal.png",
  nosnooze: "write-journal.png",
  phone_movie: "no-doomscroll.png",
  noalcohol: "good-diet.png",
  nosmoking: "no-doomscroll.png"
};

/** Category fallback when no habit-specific mapping exists */
const CATEGORY_IMAGES = {
  physical: "running.png",
  learning: "reading.png",
  focus: "deep-work.png",
  mental: "meditation.png",
  routine: "good-diet.png"
};

const DEFAULT_IMAGE = "deep-work.png";

export function getHabitImageSrc(habitOrId) {
  const habit =
    typeof habitOrId === "string" ? { id: habitOrId } : habitOrId || {};
  const id = habit.id;
  const file =
    (id && HABIT_IMAGES[id]) ||
    (habit.category && CATEGORY_IMAGES[habit.category]) ||
    DEFAULT_IMAGE;
  return `${HABIT_IMAGE_BASE}/${file}`;
}

export function hasDedicatedHabitImage(habitId) {
  return Boolean(HABIT_IMAGES[habitId]);
}

/** All image URLs (for preload / service worker). */
export function listHabitImageFiles() {
  return [
    "cold-shower.png",
    "deep-work.png",
    "good-diet.png",
    "meditation.png",
    "no-doomscroll.png",
    "reading.png",
    "running.png",
    "streching.png",
    "write-journal.png"
  ].map((f) => `${HABIT_IMAGE_BASE}/${f}`);
}
