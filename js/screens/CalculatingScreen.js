import { el } from "../ui/dom.js";
import { createShell } from "../ui/Shell.js";

const MESSAGES = [
  "Calculating health metrics...",
  "Analyzing your habits...",
  "Building your path...",
  "Almost ready..."
];

export function createCalculatingView({ goNext }) {
  const sub = el("p", {
    className: "calculating__sub",
    text: MESSAGES[0]
  });

  const body = el("div", { className: "calculating fade-in" }, [
    el("div", { className: "calculating__spinner", attrs: { "aria-hidden": "true" } }),
    el("h1", { className: "calculating__title", text: "Calculating Your Scores" }),
    sub
  ]);

  let i = 0;
  const timer = window.setInterval(() => {
    i += 1;
    if (i < MESSAGES.length) {
      sub.textContent = MESSAGES[i];
    } else {
      window.clearInterval(timer);
      goNext();
    }
  }, 700);

  const root = createShell({ centered: true, body });
  root.dataset.autoAdvance = "true";
  return root;
}
