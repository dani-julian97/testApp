import { el } from "./dom.js";

export function createShell({
  body,
  footer,
  centered = false,
  className = ""
} = {}) {
  const classes = ["shell"];
  if (centered) classes.push("shell--centered");
  if (className) classes.push(className);

  return el("div", { className: classes.join(" ") }, [
    el("div", { className: "shell__body" }, [body]),
    footer ? el("footer", { className: "shell__footer" }, [footer]) : null
  ]);
}
