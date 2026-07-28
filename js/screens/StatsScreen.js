import { el } from "../ui/dom.js";
import { createButton } from "../ui/Button.js";
import { createShell } from "../ui/Shell.js";
import { createRadarChart } from "../ui/RadarChart.js";
import { STATS_PHASES } from "../data/flow.js";

function phaseDate(phase) {
  const d = new Date();
  if (phase === "7") d.setDate(d.getDate() + 7);
  else if (phase === "30") d.setDate(d.getDate() + 30);
  else d.setDate(d.getDate() + 90);
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

export function createStatsView({ goNext, phase }) {
  const cfg = STATS_PHASES[phase] || STATS_PHASES["7"];

  const body = el(
    "div",
    {
      className: "stats-phase fade-in",
      style: `--phase-color: ${cfg.color}`
    },
    [
      el("h1", { className: "screen-title screen-title--lg", text: cfg.title }),
      el("div", { className: "stats-phase__badge", text: phaseDate(phase) }),
      el("p", { className: "stats-phase__copy", text: cfg.copy }),
      el("h2", { className: "stats-phase__heading", text: "Your Stats" }),
      createRadarChart({ values: cfg.values, color: cfg.color })
    ]
  );

  return createShell({
    body,
    footer: createButton({ label: "Continue", onClick: goNext })
  });
}
