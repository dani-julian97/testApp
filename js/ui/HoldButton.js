import { el } from "./dom.js";
import { iconSvg } from "./icons.js";
import { haptic } from "../core/haptics.js";

const HOLD_MS = 1400;

export function createHoldButton({ onComplete } = {}) {
  const ring = el("div", { className: "hold-btn__ring" });
  const node = el(
    "button",
    {
      className: "hold-btn",
      type: "button",
      attrs: { "aria-label": "Press and hold to agree" },
      style: "--hold-progress: 0"
    },
    [
      ring,
      el("div", { className: "hold-btn__icon", html: iconSvg("hand", { size: 36 }) }),
      el("div", { className: "hold-btn__label", text: "HOLD" })
    ]
  );

  let raf = null;
  let start = 0;
  let done = false;

  const setProgress = (p) => {
    node.style.setProperty("--hold-progress", String(Math.round(p * 100)));
  };

  const stop = (completed) => {
    if (raf) cancelAnimationFrame(raf);
    raf = null;
    if (!completed && !done) setProgress(0);
  };

  const tick = (now) => {
    const t = Math.min(1, (now - start) / HOLD_MS);
    setProgress(t);
    if (t >= 1) {
      done = true;
      node.classList.add("is-done");
      haptic("success");
      onComplete?.();
      stop(true);
      return;
    }
    raf = requestAnimationFrame(tick);
  };

  const begin = (e) => {
    if (done) return;
    e.preventDefault();
    haptic("light");
    start = performance.now();
    raf = requestAnimationFrame(tick);
  };

  const end = () => {
    if (done) return;
    stop(false);
  };

  node.addEventListener("pointerdown", begin);
  node.addEventListener("pointerup", end);
  node.addEventListener("pointerleave", end);
  node.addEventListener("pointercancel", end);

  return node;
}
