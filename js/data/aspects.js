/** Growth aspects shown on the Progress radar (hexagon / “pentágono” de evolución). */

export const ASPECT_KEYS = [
  "discipline",
  "health",
  "strength",
  "focus",
  "knowledge",
  "purpose"
];

export const ASPECT_LABELS = {
  discipline: "Discipline",
  health: "Health",
  strength: "Strength",
  focus: "Focus",
  knowledge: "Knowledge",
  purpose: "Purpose"
};

export const DEFAULT_ASPECTS = {
  discipline: 0.12,
  health: 0.12,
  strength: 0.1,
  focus: 0.12,
  knowledge: 0.1,
  purpose: 0.11
};

/** How much each completion nudges related aspects (very gradual). */
export const ASPECT_STEP = 0.014;

/**
 * Category → weighted aspect contributions (weights sum ~1).
 */
export const CATEGORY_ASPECTS = {
  physical: { strength: 0.55, health: 0.35, discipline: 0.1 },
  learning: { knowledge: 0.65, focus: 0.25, purpose: 0.1 },
  focus: { focus: 0.5, discipline: 0.4, knowledge: 0.1 },
  mental: { purpose: 0.4, discipline: 0.3, health: 0.15, focus: 0.15 },
  routine: { discipline: 0.45, health: 0.4, purpose: 0.15 }
};

export function emptyAspects() {
  return { ...DEFAULT_ASPECTS };
}

export function applyAspectDelta(aspects, category, direction = 1) {
  const next = { ...DEFAULT_ASPECTS, ...aspects };
  const weights = CATEGORY_ASPECTS[category] || CATEGORY_ASPECTS.mental;
  Object.entries(weights).forEach(([key, weight]) => {
    const delta = ASPECT_STEP * weight * direction;
    next[key] = Math.max(0.05, Math.min(0.98, (next[key] ?? 0.12) + delta));
  });
  return next;
}

export function aspectColor(aspects) {
  const avg =
    ASPECT_KEYS.reduce((s, k) => s + (aspects[k] || 0), 0) / ASPECT_KEYS.length;
  if (avg >= 0.7) return "#22c55e";
  if (avg >= 0.45) return "#f59e0b";
  return "#38bdf8";
}
