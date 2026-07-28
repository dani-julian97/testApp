import { el } from "./dom.js";

const LABELS = ["Discipline", "Health", "Strength", "Focus", "Knowledge", "Purpose"];
const KEYS = ["discipline", "health", "strength", "focus", "knowledge", "purpose"];

export function createRadarChart({ values, color = "#ef4444" }) {
  const size = 280;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 96;
  const levels = 4;

  const angleFor = (i) => -Math.PI / 2 + (i * 2 * Math.PI) / KEYS.length;
  const point = (i, r) => {
    const a = angleFor(i);
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
  };

  let grid = "";
  for (let lvl = 1; lvl <= levels; lvl++) {
    const r = (radius / levels) * lvl;
    const pts = KEYS.map((_, i) => point(i, r).join(",")).join(" ");
    grid += `<polygon points="${pts}" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>`;
  }

  // Axes
  let axes = "";
  KEYS.forEach((_, i) => {
    const [x, y] = point(i, radius);
    axes += `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>`;
  });

  const dataPts = KEYS.map((key, i) => {
    const v = Math.max(0.05, Math.min(1, values[key] ?? 0));
    return point(i, radius * v).join(",");
  }).join(" ");

  let labels = "";
  LABELS.forEach((label, i) => {
    const [x, y] = point(i, radius + 22);
    labels += `<text x="${x}" y="${y}" fill="rgba(255,255,255,0.45)" font-size="11" text-anchor="middle" dominant-baseline="middle">${label}</text>`;
  });

  const svg = `
    <svg viewBox="0 0 ${size} ${size}" role="img" aria-label="Stats radar chart">
      ${grid}
      ${axes}
      <polygon points="${dataPts}" fill="${color}33" stroke="${color}" stroke-width="2.5"/>
      ${labels}
    </svg>
  `;

  return el("div", { className: "radar-wrap", html: svg });
}
