import { el } from "./dom.js";
import { LIFE_EXPECTANCY } from "../data/habits.js";

/**
 * 10x10 = 100 dots representing a life (approx years via life expectancy).
 */
export function createLifeDots({ age, mode = "lived", yearsLost = 0 }) {
  const total = 100;
  const livedCount = Math.round((age / LIFE_EXPECTANCY) * total);
  const remaining = Math.max(0, total - livedCount);
  const lost = Math.min(remaining, Math.round((yearsLost / LIFE_EXPECTANCY) * total));

  const root = el("div", {
    className: "life-dots",
    attrs: { role: "img", "aria-label": lifeAria(mode, age, yearsLost) }
  });

  for (let i = 0; i < total; i++) {
    const classes = ["life-dot"];
    if (mode === "lived") {
      if (i < livedCount) classes.push("is-lived");
    } else if (mode === "left") {
      if (i < livedCount) classes.push("is-lived");
      else classes.push("is-remaining");
    } else if (mode === "phone") {
      if (i < livedCount) classes.push("is-lived");
      else if (i >= total - lost) classes.push("is-lost");
      else classes.push("is-remaining");
    }
    root.append(el("div", { className: classes.join(" ") }));
  }

  return root;
}

function lifeAria(mode, age, yearsLost) {
  if (mode === "lived") return `Life progress visualization at age ${age}`;
  if (mode === "left") return `Years remaining visualization`;
  return `Years potentially lost to phone: about ${yearsLost}`;
}
