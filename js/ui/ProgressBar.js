import { el } from "./dom.js";

export function createProgressBar({ percent = 0 } = {}) {
  const bar = el("div", { className: "progress-top__bar" });
  bar.style.width = `${percent}%`;

  const label = el("div", {
    className: "progress-top__label",
    text: `${percent}% complete`
  });

  const root = el(
    "div",
    {
      className: "progress-top",
      attrs: {
        role: "progressbar",
        "aria-valuemin": "0",
        "aria-valuemax": "100",
        "aria-valuenow": String(percent)
      }
    },
    [el("div", { className: "progress-top__track" }, [bar]), label]
  );

  return {
    el: root,
    update(percentNext) {
      const p = Math.max(0, Math.min(100, Math.round(percentNext)));
      bar.style.width = `${p}%`;
      label.textContent = `${p}% complete`;
      root.setAttribute("aria-valuenow", String(p));
    }
  };
}
