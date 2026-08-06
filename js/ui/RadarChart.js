import { el } from "./dom.js";
import { ASPECT_KEYS, ASPECT_LABELS } from "../data/aspects.js";

function buildPoints(keys, values, radius, pointFn) {
  return keys
    .map((key, i) => {
      const v = Math.max(0.05, Math.min(1, values[key] ?? 0));
      return pointFn(i, radius * v).join(",");
    })
    .join(" ");
}

export function createRadarChart({ values, color = "#ef4444", labels } = {}) {
  const keys = ASPECT_KEYS;
  const labelMap = labels || ASPECT_LABELS;
  const size = 280;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 96;
  const levels = 4;

  const angleFor = (i) => -Math.PI / 2 + (i * 2 * Math.PI) / keys.length;
  const point = (i, r) => {
    const a = angleFor(i);
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
  };

  let grid = "";
  for (let lvl = 1; lvl <= levels; lvl++) {
    const r = (radius / levels) * lvl;
    const pts = keys.map((_, i) => point(i, r).join(",")).join(" ");
    grid += `<polygon points="${pts}" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>`;
  }

  let axes = "";
  keys.forEach((_, i) => {
    const [x, y] = point(i, radius);
    axes += `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>`;
  });

  const dataPts = buildPoints(keys, values || {}, radius, point);

  let labelSvg = "";
  keys.forEach((key, i) => {
    const [x, y] = point(i, radius + 22);
    const label = labelMap[key] || key;
    labelSvg += `<text x="${x}" y="${y}" fill="rgba(255,255,255,0.5)" font-size="11" text-anchor="middle" dominant-baseline="middle">${label}</text>`;
  });

  const svg = `
    <svg viewBox="0 0 ${size} ${size}" role="img" aria-label="Growth radar chart">
      ${grid}
      ${axes}
      <polygon class="radar-data" points="${dataPts}" fill="${color}33" stroke="${color}" stroke-width="2.5"/>
      ${labelSvg}
    </svg>
  `;

  const wrap = el("div", { className: "radar-wrap", html: svg });

  wrap.updateValues = (nextValues, nextColor) => {
    const poly = wrap.querySelector(".radar-data");
    if (!poly) return;
    poly.classList.remove("is-updating");
    // force reflow for subtle pulse
    void poly.getBoundingClientRect();
    poly.setAttribute("points", buildPoints(keys, nextValues || {}, radius, point));
    if (nextColor) {
      poly.setAttribute("fill", `${nextColor}33`);
      poly.setAttribute("stroke", nextColor);
    }
    poly.classList.add("is-updating");
  };

  return wrap;
}
