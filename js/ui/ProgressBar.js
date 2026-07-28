import { el } from "./dom.js";

export function createProgressBar({ current, total }) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;

  const bar = el("div", { className: "progress__bar" });
  bar.style.width = `${pct}%`;

  const meta = el("div", { className: "progress__meta" }, [
    el("span", { text: "Onboarding" }),
    el("span", { text: `${current} of ${total}` })
  ]);

  const root = el("div", {
    className: "progress",
    attrs: {
      role: "progressbar",
      "aria-valuemin": "0",
      "aria-valuemax": String(total),
      "aria-valuenow": String(current),
      "aria-label": `Step ${current} of ${total}`
    }
  }, [
    meta,
    el("div", { className: "progress__track" }, [bar])
  ]);

  return {
    el: root,
    update({ current: c, total: t }) {
      const nextPct = t > 0 ? Math.round((c / t) * 100) : 0;
      bar.style.width = `${nextPct}%`;
      meta.lastChild.textContent = `${c} of ${t}`;
      root.setAttribute("aria-valuenow", String(c));
      root.setAttribute("aria-valuemax", String(t));
      root.setAttribute("aria-label", `Step ${c} of ${t}`);
    }
  };
}
