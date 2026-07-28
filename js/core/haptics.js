/**
 * Light haptic feedback. Falls back silently when unsupported.
 */
const PATTERNS = {
  light: 8,
  medium: 16,
  success: [12, 40, 22]
};

export function haptic(type = "light") {
  try {
    if (typeof navigator === "undefined" || !navigator.vibrate) return;
    navigator.vibrate(PATTERNS[type] ?? PATTERNS.light);
  } catch {
    /* ignore */
  }
}
